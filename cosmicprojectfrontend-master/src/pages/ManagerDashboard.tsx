import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCards from "@/components/dashboard/StatsCards";
import { API_BASE_URL, FILE_BASE_URL } from "@/config/environment";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  TrendingUp,
  FileText,
  Upload,
  X,
  Download,
} from "lucide-react";
import toast from 'react-hot-toast';
import { useSocket } from "@/contexts/SocketContext";
import { getProjectStatusClasses, getTaskStatusClasses } from "@/utils/statusStyles";



const ManagerDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isTeamReportsOpen, setIsTeamReportsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskLocationLink, setTaskLocationLink] = useState("");
  const [taskFiles, setTaskFiles] = useState<any[]>([]);

  // State for projects and team members
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [managerStats, setManagerStats] = useState({
    assignedProjectsCount: 0,
    techniciansCount: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { socket } = useSocket();
  const [selectedReportTaskId, setSelectedReportTaskId] = useState(null);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);


  // Manager dashboard stats - using real data
  const stats = [
    {
      title: "Assigned Projects",
      value: managerStats.assignedProjectsCount,
      description: "Active projects from Super Admin",
      icon: ClipboardList,
    },
    {
      title: "Team Members",
      value: managerStats.techniciansCount,
      description: "Technicians under supervision",
      icon: Users,
    },
    {
      title: "Completed Tasks",
      value: managerStats.completedTasks,
      description: "This month",
      icon: CheckCircle,
    },
    {
      title: "Pending Tasks",
      value: managerStats.pendingTasks,
      description: "Awaiting technician action",
      icon: Clock,
    },
  ];

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(`${API_BASE_URL}/profile`, { headers });
    const data = await res.json();
    if (data.status === "success") {
      setUserProfile(data.data);
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch(`${API_BASE_URL}/profile/picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      if (data.status === "success") {
        // Refetch user profile to get updated data
        await fetchUserProfile();
        toast.success("Profile picture uploaded successfully!");
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload profile picture");
      throw error;
    }
  };

  const handleProfilePictureRemove = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/profile/picture`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Remove failed with status ${response.status}`);
      }

      if (data.status === "success") {
        // Clear the profile picture
        setUserProfile(prev => ({
          ...prev,
          profilePicture: undefined
        }));
        toast.success("Profile picture removed successfully!");
      } else {
        throw new Error(data.message || "Remove failed");
      }
    } catch (error) {
      console.error("Profile picture removal error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove profile picture");
      throw error;
    }
  };

  // Fetch manager data from backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Fetch user profile
    fetchUserProfile();

    // Fetch manager's assigned projects
    fetch(`${API_BASE_URL}/manager/projects`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setAssignedProjects(data.data);
        }
      })
      .catch(console.error);

    // Fetch technicians
    fetch(`${API_BASE_URL}/manager/technicians`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setTeamMembers(data.data);
        }
      })
      .catch(console.error);

    // Fetch manager stats
    fetch(`${API_BASE_URL}/manager/stats`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setManagerStats(data.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Project created
    socket.on("project_created", (data) => {
      toast.success(`New project "${data.project.siteName}" assigned to you.`);
    });
    // Task assigned
    socket.on("task_assigned", (data) => {
      toast.success(`Task "${data.task.title}" assigned to technician.`);
    });
    // Task status updated
    socket.on("task_status_updated", (data) => {
      console.log("Received real-time update (manager):", data);
      toast(`Task "${data.task.title}" status updated to "${data.task.status}".`);
      // Optimistically update the task in state
      setTasks((prevTasks) => {
        const idx = prevTasks.findIndex((t) => t._id === data.task._id || t.id === data.task._id);
        if (idx !== -1) {
          const updated = [...prevTasks];
          updated[idx] = { ...updated[idx], ...data.task };
          return updated;
        }
        return prevTasks;
      });
      // Optimistically update the project in state
      if (data.project) {
        setAssignedProjects((prevProjects) => {
          const idx = prevProjects.findIndex((p) => p._id === data.project._id || p.id === data.project._id);
          if (idx !== -1) {
            const updated = [...prevProjects];
            updated[idx] = { ...updated[idx], ...data.project };
            return updated;
          }
          return prevProjects;
        });
      }
      // Re-fetch tasks from backend and update state
      const token = localStorage.getItem("token");
      fetch(`${API_BASE_URL}/manager/tasks`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((tasksData) => {
          if (tasksData.status === "success") {
            setTasks(tasksData.data);
            console.log("[FRONTEND DEBUG] Tasks fetched from backend:", tasksData.data);
          }
        })
        .catch(console.error);
      // Re-fetch manager stats from backend
      fetch(`${API_BASE_URL}/manager/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            setManagerStats(data.data);
          }
        })
        .catch(console.error);
    });
    // Report submitted
    socket.on("report_submitted", (data) => {
      toast.success(`Report submitted for task "${data.report.task}".`);
    });
    return () => {
      socket.off("project_created");
      socket.off("task_assigned");
      socket.off("task_status_updated");
      socket.off("report_submitted");
    };
  }, [socket]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("[FRONTEND DEBUG] No token found");
      return;
    }
    fetch(`${API_BASE_URL}/manager/tasks`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((tasksData) => {
        if (tasksData.status === "success") {
          setTasks(tasksData.data);
          console.log("[FRONTEND DEBUG] Tasks fetched from backend:", tasksData.data);
        } else {
          console.error("[FRONTEND DEBUG] Error fetching tasks:", tasksData);
        }
      })
      .catch((err) => {
        console.error("[FRONTEND DEBUG] Fetch error:", err);
      });
  }, []);

  const handleCreateTask = async () => {
    // Check if there are projects and technicians available
    if (assignedProjects.length === 0) {
      alert(
        "No projects available. Please wait for Super Admin to assign projects to you.",
      );
      return;
    }

    if (teamMembers.length === 0) {
      alert(
        "No team members available. Please contact Super Admin to assign technicians to your team.",
      );
      return;
    }

    if (!selectedProjectId || !selectedTechnician || !taskTitle) {
      alert("Please fill in all required fields (Project, Technician, Title)");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("title", taskTitle);
      formData.append("description", taskDescription);
      formData.append("projectId", selectedProjectId);
      formData.append("technicianId", selectedTechnician);
      formData.append("priority", taskPriority || "medium");
      formData.append("deadline", taskDeadline);
      formData.append("locationLink", taskLocationLink);

      // Add uploaded files
      taskFiles.forEach((file, index) => {
        if (file.file && !file.isProjectFile) {
          formData.append("files", file.file);
        }
      });

      // Add project files
      const projectFiles = taskFiles
        .filter(file => file.isProjectFile)
        .map(file => file.projectFilePath);

      projectFiles.forEach(filePath => {
        formData.append("projectFiles", filePath);
      });

      const response = await fetch(`${API_BASE_URL}/manager/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        // Refresh the tasks list
        const tasksResponse = await fetch(
          `${API_BASE_URL}/manager/tasks`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const tasksData = await tasksResponse.json();
        if (tasksData.status === "success") {
          setTasks(tasksData.data);
        }

        // Find project and technician names for confirmation
        const project = assignedProjects.find((p) => p._id === selectedProjectId);
        const technician = teamMembers.find(
          (t) => t._id === selectedTechnician,
        );

        // Emit socket event to notify technician
        if (socket) {
          const taskData = {
            task: {
              _id: data.data._id,
              title: taskTitle,
              description: taskDescription,
              priority: taskPriority || "medium",
              deadline: taskDeadline,
              status: "assigned"
            },
            technician: {
              _id: selectedTechnician,
              name: technician?.name || "Unknown"
            },
            project: {
              _id: selectedProjectId,
              siteName: project?.siteName || "Unknown"
            }
          };

          socket.emit('task:assigned', taskData);
        } else {
          console.log("Socket not available for task assignment notification");
        }

        alert(
          `✅ Task "${taskTitle}" has been successfully assigned to ${technician?.name || "Unknown"} for project "${project?.siteName || "Unknown"}"\n\nThe technician will be notified and can now view this task in their dashboard.`,
        );

        // Reset form
        setTaskTitle("");
        setTaskDescription("");
        setSelectedProjectId("");
        setSelectedTechnician("");
        setTaskPriority("");
        setTaskDeadline("");
        setTaskLocationLink("");
        setTaskFiles([]);
        setIsCreateTaskOpen(false);
      } else {
        alert(`❌ Failed to create task: ${data.message}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("❌ Failed to create task. Please try again.");
    }
  };

  const handleViewProject = (projectId: string) => {
    const project = assignedProjects.find((p) => p._id === projectId);
    if (project) {
      alert(
        `Project Details:\n\n` +
        `Name: ${project.siteName}\n` +
        `Client: ${project.clientName}\n` +
        `Client Mobile No: ${project.clientMobile}\n` +
        `Location: ${project.location}\n` +
        `Status: ${project.status || "Active"}\n` +
        `Progress: ${project.progress || 0}%\n` +
        `Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}\n\n` +
        `Description: ${project.description || "No description"}\n` +
        `Priority: ${project.priority || "Medium"}`,
      );
    }
  };

  const handleViewTechnician = (technicianId: string) => {
    const technician = teamMembers.find((t) => t._id === technicianId);
    if (technician) {
      alert(
        `Technician Details:\n\n` +
        `Name: ${technician.name}\n` +
        `Email: ${technician.email}\n` +
        `Role: ${technician.role}\n` +
        `Status: Active\n\n` +
        `Detailed performance view will be implemented in the next phase.`,
      );
    }
  };

  const handleTeamReports = () => {
    setIsTeamReportsOpen(true);
  };

  const handleGenerateTeamReport = (reportType: string) => {
    alert(
      `Generating ${reportType} report...\n\n` +
      `This will include:\n` +
      `- Individual technician performance\n` +
      `- Task completion rates\n` +
      `- Quality metrics\n` +
      `- Time tracking data\n` +
      `- Team efficiency analysis\n\n` +
      `Report will be downloaded shortly.`,
    );
  };

  const handleTeamPerformance = () => {
    alert(
      `Team Performance Overview:\n\n` +
      `Overall Performance: Excellent\n` +
      `Task Completion Rate: 94%\n` +
      `Average Response Time: 2.3 hours\n` +
      `Quality Score: 92%\n` +
      `Customer Satisfaction: 96%\n\n` +
      `Detailed performance analytics will be implemented in the next phase.`,
    );
  };

  const handleProjectTimeline = () => {
    alert(
      `Project Timeline View:\n\n` +
      `This will show:\n` +
      `- Gantt chart of all projects\n` +
      `- Task dependencies\n` +
      `- Critical path analysis\n` +
      `- Resource allocation\n` +
      `- Milestone tracking\n\n` +
      `Timeline view will be implemented in the next phase.`,
    );
  };

  const downloadTaskReport = async (task) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to download task report.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reports/task-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks: [task] }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${task.title.replace(/\s+/g, '_')}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download task report: " + err.message);
    }
  };

  const sortedAssignedProjects = assignedProjects
    .slice()
    .sort((a, b) => {
      const getTime = (project: any) => {
        const created = project.createdAt
          ? new Date(project.createdAt).getTime()
          : 0;
        const deadline = project.deadline
          ? new Date(project.deadline).getTime()
          : 0;
        return created || deadline;
      };

      return getTime(b) - getTime(a);
    });

  const sortedTasks = tasks
    .slice()
    .sort((a, b) => {
      const getTime = (task: any) => {
        const created = task.createdAt
          ? new Date(task.createdAt).getTime()
          : 0;
        const assigned = task.assignedDate
          ? new Date(task.assignedDate).getTime()
          : 0;
        const deadline = task.deadline
          ? new Date(task.deadline).getTime()
          : 0;
        return created || assigned || deadline;
      };

      return getTime(b) - getTime(a);
    });

  const selectedProjectNew = assignedProjects.find(
    (project) => project._id === selectedProjectId
  );


  return (
    <DashboardLayout
      userRole="manager"
      userName={userProfile?.name || "Project Manager"}
      userEmail={userProfile?.email || "manager@cosmicsolutions.com"}
      userProfilePicture={userProfile?.profilePicture ? `${FILE_BASE_URL}/${userProfile.profilePicture}` : undefined}
      onProfilePictureUpload={handleProfilePictureUpload}
      onProfilePictureRemove={handleProfilePictureRemove}
    >
      <div className="mobile-container mobile-space-y max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="mobile-text-2xl font-bold text-foreground">
              Project Management
            </h1>
            <p className="text-muted-foreground mt-1 mobile-text-base">
              Manage your assigned projects and team members.
            </p>
          </div>
          <div className="mobile-button-group">
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              className="mobile-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
            <Button
              variant="outline"
              onClick={handleTeamReports}
              className="mobile-button"
            >
              <FileText className="mr-2 h-4 w-4" />
              Task Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Main Content Grid */}
        <div className="mobile-grid-3">
          {/* Assigned Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects Card */}
            <Card className="mobile-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-col sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="mobile-text-lg">Assigned Projects</CardTitle>
                    <CardDescription className="mobile-text-sm">
                      Projects assigned by Super Admin
                    </CardDescription>
                  </div>
                  <div className="mobile-action-buttons">
                    <div className="mobile-search">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mobile-search-input"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assignedProjects.length === 0 ? (
                  <div className="mobile-empty-state">
                    <ClipboardList className="mobile-empty-state-icon text-muted-foreground" />
                    <h3 className="mobile-empty-state-title">
                      No projects assigned yet
                    </h3>
                    <p className="mobile-empty-state-description">
                      Projects assigned by Super Admin will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mobile-space-y">
                    {sortedAssignedProjects.map((project) => (
                      <div
                        key={project._id}
                        className="mobile-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h4 className="mobile-text-base font-medium text-foreground mb-1">
                              {project.siteName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-4 mobile-text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{project.clientName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{project.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Due{" "}
                                  {project.deadline
                                    ? new Date(
                                      project.deadline,
                                    ).toLocaleDateString()
                                    : "No deadline"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mobile-action-buttons">
                            <Badge
                              variant="outline"
                              className={`${getProjectStatusClasses(project.status || "Planning")} border-0 mobile-badge`}
                            >
                              {project.status || "Planning"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProject(project._id)}
                              className="mobile-button"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {/* Update Status Dropdown */}
                            <select
                              value={project.status || "Planning"}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  const token = localStorage.getItem("token");
                                  const response = await fetch(`${API_BASE_URL}/projects/${project._id}/status`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ status: newStatus }),
                                  });
                                  const data = await response.json();
                                  if (data.status === "success") {
                                    // Update project in state
                                    setAssignedProjects((prev) => prev.map((p) => p._id === project._id ? { ...p, status: newStatus } : p));
                                    toast.success("Project status updated!");
                                  } else {
                                    toast.error(data.message || "Failed to update status");
                                  }
                                } catch (err) {
                                  toast.error("Failed to update status");
                                }
                              }}
                              className="mobile-select border rounded-sm px-2 py-1 mobile-text-sm text-black"
                            >
                              <option value="Planning">Planning</option>
                              <option value="In Progress">Start Working</option>
                              <option value="Delayed">Delayed</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>

                        {/* Add file links section */}
                        {project.files && project.files.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Project Files:</span>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {project.files.map((file, idx) => (
                                <li key={idx}>
                                  <a
                                    href={`${FILE_BASE_URL}/${file.path.replace(/\\/g, '/')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-blue-800"
                                  >
                                    {file.originalName || file.filename}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Tasks Card */}
            {/* All Tasks – Card Layout */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
              </CardHeader>

              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-muted-foreground">No tasks assigned yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-3 gap-6">
                    {sortedTasks.map((task) => {
                      const isOverdue =
                        task.deadline &&
                        new Date(task.deadline) < new Date() &&
                        task.status !== "Completed";

                      const statusLabel = isOverdue ? "Overdue" : task.status;

                      const statusClass = isOverdue
                        ? "bg-red-100 text-red-700"
                        : task.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : task.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700";

                      return (
                        <div
                          key={task._id || task.id}
                          onClick={() => {
                            setSelectedTask(task);
                            setIsViewTaskOpen(true);
                          }}
                          className="border rounded-xl p-4  hover:shadow-md transition cursor-pointer"
                        >

                          {/* Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">
                                {task.title?.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold">{task.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {task.project?.siteName || "No Project"}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              <strong>Technician:</strong>{" "}
                              {task.assignedTo?.name || "Unassigned"}
                            </p>
                            <p className={isOverdue ? "text-red-600 font-medium" : ""}>
                              <strong>Deadline:</strong>{" "}
                              {task.deadline
                                ? new Date(task.deadline).toLocaleDateString()
                                : "No deadline"}
                            </p>
                          </div>

                          {/* Status History */}
                          <div className="mt-3 text-xs text-gray-500">
                            {task.statusLog && task.statusLog.length > 0 ? (
                              <>
                                {task.statusLog.slice(0, 2).map((log, idx) => (
                                  <p key={idx}>
                                    • {log.status}{" "}
                                    {log.timestamp &&
                                      `(${new Date(log.timestamp).toLocaleDateString()})`}
                                  </p>
                                ))}
                                {task.statusLog.length > 2 && (
                                  <p className="text-blue-600">
                                    +{task.statusLog.length - 2} more updates
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>No history</p>
                            )}
                          </div>

                          {/* Project Files & Map */}
                          <div
                            className="mt-4 flex flex-wrap gap-4 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >

                            {task.project?.mapLink && (
                              <a
                                href={task.project.mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                📍 Map
                              </a>
                            )}

                            {task.project?.files?.length > 0 && (
                              <div className="text-blue-600">
                                📁 Files:
                                <ul className="ml-4 list-disc">
                                  {task.project.files.slice(0, 2).map((file, idx) => (
                                    <li key={idx}>
                                      <a
                                        href={`${FILE_BASE_URL}/${file.path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                      >
                                        {file.originalName || file.filename}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activities */}
            {/* Remove any <div> or section with Recent Activities title, clipboard icon, and placeholder text from the JSX. */}
          </div>
        </div>

        {/* Create Task Dialog */}
        <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
          <DialogContent className="mobile-dialog-content max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mobile-text-lg">Create New Task</DialogTitle>
              <DialogDescription className="mobile-text-sm">
                Assign a new task to one of your team members.
              </DialogDescription>
            </DialogHeader>
            <div className="mobile-form py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="mobile-form-group w-full">
                  <Label htmlFor="project" className="mobile-text-sm">Project *</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                  >
                    <SelectTrigger className="mobile-select w-full" >
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedProjects.length === 0 ? (
                        <SelectItem value="" disabled>
                          No projects available
                        </SelectItem>
                      ) : (
                        assignedProjects.map((project) => (

                          <SelectItem key={project._id} value={project._id}>
                            {project.siteName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-title">Client Mobile No</Label>
                  <Input
                    id="mob_no"
                    placeholder="client Mobile No"
                    value={selectedProjectNew?.clientMobile || ""}
                    readOnly
                    className="cursor-not-allowed "
                  />

                </div>
                <div className="mobile-form-group w-full">
                  <Label htmlFor="technician" className="mobile-text-sm">Assign to *</Label>
                  <Select
                    value={selectedTechnician}
                    onValueChange={setSelectedTechnician}
                  >
                    <SelectTrigger className="mobile-select w-full" >
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.length === 0 ? (
                        <SelectItem value="" disabled>
                          No team members available
                        </SelectItem>
                      ) : (
                        teamMembers.map((member) => (
                          <SelectItem key={member._id} value={member._id}>
                            {member.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project Map Link Display */}
              {selectedProject && (() => {
                const selectedProjectData = assignedProjects.find(p => p._id === selectedProject);
                return selectedProjectData?.mapLink ? (
                  <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded border">
                    <div className="font-medium mb-1">📍 Project Map Link:</div>
                    <a
                      href={selectedProjectData.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {selectedProjectData.mapLink}
                    </a>
                  </div>
                ) : null;
              })()}

              {/* Project Files Display */}
              {selectedProject && (() => {
                const selectedProjectData = assignedProjects.find(p => p._id === selectedProject);
                return selectedProjectData?.files && selectedProjectData.files.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Project Files</Label>
                    <div className="text-xs text-blue-600 p-2 bg-blue-50 rounded border">
                      <div className="font-medium mb-2">📎 Project Files Available:</div>
                      <div className="space-y-1">
                        {selectedProjectData.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-1.5 rounded border">
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-700 truncate">{file.originalName || file.filename}</span>
                              {file.size && (
                                <span className="text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const projectFile = {
                                  name: file.originalName || file.filename,
                                  size: file.size || 0,
                                  isProjectFile: true,
                                  projectFilePath: file.path || file.filename
                                };
                                setTaskFiles([...taskFiles, projectFile]);
                              }}
                            >
                              Add to Task
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  placeholder="Enter task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Enter task description and requirements"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Upload Files</Label>
                <div className="space-y-3">
                  {/* File Upload Button */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('task-file-upload')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Files
                    </Button>
                    <input
                      id="task-file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);

                        // Validate file sizes (10MB limit)
                        const validFiles = files.filter(file => {
                          if (file.size > 10 * 1024 * 1024) {
                            alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
                            return false;
                          }
                          return true;
                        });

                        // Check total number of files (max 10)
                        if (taskFiles.length + validFiles.length > 10) {
                          alert("Maximum 10 files allowed. Please remove some files first.");
                          return;
                        }

                        const newFiles = validFiles.map(file => ({
                          name: file.name,
                          size: file.size,
                          file: file,
                          isProjectFile: false
                        }));
                        setTaskFiles([...taskFiles, ...newFiles]);
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      Max 10 files, 10MB each
                    </span>
                  </div>

                  {/* Selected Files Display */}
                  {taskFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Files:</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {taskFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                  {file.isProjectFile && " (Project File)"}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTaskFiles(taskFiles.filter((_, i) => i !== index));
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-location-link">Location Link (Google Maps)</Label>
                <Input
                  id="task-location-link"
                  placeholder="Enter Google Maps link or coordinates"
                  value={taskLocationLink}
                  onChange={(e) => setTaskLocationLink(e.target.value)}
                />
                {selectedProject && (() => {
                  const selectedProjectData = assignedProjects.find(p => p._id === selectedProject);
                  return selectedProjectData?.mapLink ? (
                    <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded border">
                      <div className="font-medium mb-1">💡 Tip:</div>
                      <div>This project has a map link. You can copy it from above or use your own link.</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => setTaskLocationLink(selectedProjectData.mapLink)}
                      >
                        Use Project's Map Link
                      </Button>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={taskPriority} onValueChange={setTaskPriority}>
                    <SelectTrigger className="w-full" >
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateTaskOpen(false);
                  // Reset form
                  setTaskTitle("");
                  setTaskDescription("");
                  setSelectedProject("");
                  setSelectedTechnician("");
                  setTaskPriority("");
                  setTaskDeadline("");
                  setTaskLocationLink("");
                  setTaskFiles([]);
                  // Reset file input
                  const fileInput = document.getElementById('task-file-upload') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTask} className="w-full sm:w-auto">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Task Report Dialog */}
        <Dialog open={isTeamReportsOpen} onOpenChange={setIsTeamReportsOpen}>
          <DialogContent className="mobile-dialog-content max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mobile-text-lg">Task Report</DialogTitle>
              <DialogDescription className="mobile-text-sm">
                View all tasks updated by technicians, including attachments and descriptions. You can also download this report as a PDF.
              </DialogDescription>
            </DialogHeader>

            <div className="mobile-space-y">
              {tasks.length === 0 ? (
                <div className="mobile-empty-state">
                  <div className="mobile-empty-state-icon">📋</div>
                  <h3 className="mobile-empty-state-title">No tasks available</h3>
                  <p className="mobile-empty-state-description">
                    There are no tasks to display in the report.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden sm:block">
                    <div className="responsive-table">
                      <table className="w-full border-collapse ">
                        <thead>
                          <tr>
                            <th className="w-12 text-center border-b border-gray-200 py-3 mobile-text-sm font-medium">Select</th>
                            <th className="border-b border-gray-200 py-3 mobile-text-sm font-medium text-left">Title</th>
                            <th className="border-b border-gray-200 py-3 mobile-text-sm font-medium text-left">Status</th>
                            <th className="border-b border-gray-200 py-3 mobile-text-sm font-medium text-left">Attachments</th>
                            <th className="border-b border-gray-200 py-3 mobile-text-sm font-medium text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task) => (
                            <tr key={task._id || task.id} className="">
                              <td className="text-center border-b border-gray-200 py-3">
                                <input
                                  type="radio"
                                  name="selectedTaskReport"
                                  checked={selectedReportTaskId === (task._id || task.id)}
                                  onChange={() => setSelectedReportTaskId(task._id || task.id)}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="border-b border-gray-200 py-3 mobile-text-sm">{task.title}</td>
                              <td className="border-b border-gray-200 py-3 mobile-text-sm">
                                <Badge variant="outline" className="capitalize">
                                  {task.status}
                                </Badge>
                              </td>
                              <td className="border-b border-gray-200 py-3 mobile-text-sm">
                                {(task.files && task.files.length > 0) ? (
                                  <ul className="space-y-1">
                                    {task.files.map((file, idx) => (
                                      <li key={idx}>
                                        <a
                                          href={file.url || `${FILE_BASE_URL}/${file.path}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline text-xs"
                                        >
                                          {file.originalName || file.name || file.filename || 'Attachment'}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-gray-500 text-xs">No attachments</span>
                                )}
                              </td>
                              <td className="border-b border-gray-200 py-3 mobile-text-sm text-gray-600">
                                {task.description || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-4">
                    {tasks.map((task) => (
                      <div
                        key={task._id || task.id}
                        className={`mobile-card p-4 border-2 transition-colors ${selectedReportTaskId === (task._id || task.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => setSelectedReportTaskId(task._id || task.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="selectedTaskReport"
                            checked={selectedReportTaskId === (task._id || task.id)}
                            onChange={() => setSelectedReportTaskId(task._id || task.id)}
                            className="w-4 h-4 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="mobile-text-base font-medium text-gray-900 truncate">
                                {task.title}
                              </h4>
                              <Badge variant="outline" className="capitalize mobile-text-xs">
                                {task.status}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <span className="mobile-text-xs font-medium text-gray-500">Description:</span>
                                <p className="mobile-text-sm text-gray-700 mt-1">
                                  {task.description || 'No description available'}
                                </p>
                              </div>

                              <div>
                                <span className="mobile-text-xs font-medium text-gray-500">Attachments:</span>
                                {(task.files && task.files.length > 0) ? (
                                  <div className="mt-1 space-y-1">
                                    {task.files.map((file, idx) => (
                                      <div key={idx}>
                                        <a
                                          href={file.url || `${FILE_BASE_URL}/${file.path}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mobile-text-xs text-blue-600 hover:text-blue-800 underline break-all"
                                        >
                                          {file.originalName || file.name || file.filename || 'Attachment'}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mobile-text-xs text-gray-500 mt-1">No attachments</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mobile-button-group mt-6">
              <Button
                variant="outline"
                onClick={() => setIsTeamReportsOpen(false)}
                className="mobile-button"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const selectedTask = tasks.find(t => (t._id || t.id) === selectedReportTaskId);
                  if (selectedTask) downloadTaskReport(selectedTask);
                }}
                disabled={!selectedReportTaskId}
                className="mobile-button"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={isViewTaskOpen} onOpenChange={setIsViewTaskOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              Task details & status information
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 text-sm">
              <div>
                <strong>Status:</strong>{" "}
                <Badge className={getTaskStatusClasses(selectedTask.status)}>
                  {selectedTask.status}
                </Badge>
              </div>

              <div>
                <strong>Project:</strong>{" "}
                {selectedTask.project?.siteName || "N/A"}
              </div>

              <div>
                <strong>Technician:</strong>{" "}
                {selectedTask.assignedTo?.name || "Unassigned"}
              </div>

              <div>
                <strong>Deadline:</strong>{" "}
                {selectedTask.deadline
                  ? new Date(selectedTask.deadline).toLocaleDateString()
                  : "No deadline"}
              </div>

              <div>
                <strong>Description:</strong>
                <p className="mt-1 text-muted-foreground">
                  {selectedTask.description || "No description provided"}
                </p>
              </div>

              {/* Status Timeline */}
              <div>
                <strong>Status History:</strong>
                <ul className="mt-2 space-y-1">
                  {selectedTask.statusLog?.length > 0 ? (
                    selectedTask.statusLog.map((log, idx) => (
                      <li key={idx} className="text-xs text-gray-600">
                        • {log.status}{" "}
                        {log.timestamp &&
                          `(${new Date(log.timestamp).toLocaleString()})`}
                        {log.comment && ` – ${log.comment}`}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-gray-500">No history</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};


export default ManagerDashboard;
