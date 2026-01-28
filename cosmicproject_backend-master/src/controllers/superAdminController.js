const Project = require("../models/Project");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

exports.getStats = async (req, res) => {
  try {
    const managersCount = await User.countDocuments({ role: "manager" });
    const projectsCount = await Project.countDocuments();
    const completedTasks = await Project.aggregate([
      { $group: { _id: null, total: { $sum: "$completedTasks" } } },
    ]);
    const pendingTasks = await Project.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ["$tasksCount", "$completedTasks"] } },
        },
      },
    ]);

    res.json({
      status: "success",
      data: {
        managersCount,
        projectsCount,
        completedTasks: completedTasks[0]?.total || 0,
        pendingTasks: pendingTasks[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch stats",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate(
      "assignedManager",
      "name email",
    );
    res.json({
      status: "success",
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch projects",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const {
      clientName,
      siteName,
      clientMobile,
      location,
      mapLink,
      priority,
      deadline,
      description,
      notes,
      assignedManager,
      files,
    } = req.body;

    // Get the SuperAdmin who is creating the project
    const createdBy = req.user;
    console.log("BODY:", req.body);
    // Create the project
    const project = await Project.create({
      clientName,
      clientMobile,
      siteName,
      location,
      mapLink,
      priority,
      deadline,
      description,
      notes,
      assignedManager,
      files,
      status: "Planning",
      createdBy: createdBy._id,
    });

    // Send notifications to SuperAdmin and assigned Manager
    try {
      await notificationService.notifyProjectCreated(
        project,
        createdBy,
        assignedManager || null
      );
      console.log("✅ Project creation notifications sent successfully");
    } catch (notificationError) {
      console.error("❌ Error sending notifications:", notificationError.message);
      // Don't fail the request if notifications fail
    }

    // Emit socket event for real-time dashboard updates
    if (global.socketServer) {
      try {
        global.socketServer.emitProjectCreated(project, createdBy);
      } catch (socketError) {
        console.error("❌ Error emitting socket event:", socketError.message);
      }
    }

    // Populate manager details for response
    await project.populate("assignedManager", "name email department");

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create project",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};


exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: "manager" });
    res.json({
      status: "success",
      data: managers,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch managers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
