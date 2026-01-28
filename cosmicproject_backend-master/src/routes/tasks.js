const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Test endpoint to verify route registration (remove in production)
router.get('/test-reassign-route', (req, res) => {
  res.json({
    status: 'success',
    message: 'Tasks routes are registered correctly',
    availableRoutes: [
      'POST /api/tasks/:taskId/reassign (SuperAdmin only)',
      'POST /api/tasks/ (Manager only)'
    ]
  });
});

// Reassign task (SuperAdmin only) - MUST come before other POST routes
router.post('/:taskId/reassign',
  protect,
  authorize('superadmin'),
  [
    body('technicianId').notEmpty().withMessage('Technician ID is required'),
    body('reason').trim().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters')
  ],
  async (req, res) => {
    try {
      console.log('🔵 Reassign route hit!');
      console.log('🔵 Request method:', req.method);
      console.log('🔵 Request path:', req.path);
      console.log('🔵 Request originalUrl:', req.originalUrl);
      console.log('🔵 Task ID:', req.params.taskId);
      console.log('🔵 Request body:', req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { taskId } = req.params;
      const { technicianId, reason } = req.body;

      // Find the task
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('project', 'siteName clientName')
        .populate('assignedBy', 'name email');

      if (!task) {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found'
        });
      }

      // Check if new technician exists and is active
      const newTechnician = await User.findById(technicianId);
      if (!newTechnician || newTechnician.role !== 'technician') {
        return res.status(404).json({
          status: 'error',
          message: 'Technician not found or invalid'
        });
      }

      if (newTechnician.status !== 'Active') {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot assign task to inactive technician'
        });
      }

      // Store old technician for notification
      const oldTechnician = task.assignedTo;

      // Update task
      task.assignedTo = newTechnician._id;
      
      // Add reassignment log entry
      const reassignmentLog = {
        status: task.status,
        updatedBy: req.user._id,
        timestamp: new Date(),
        comment: `Task reassigned from ${oldTechnician?.name || 'N/A'} to ${newTechnician.name}. Reason: ${reason}`,
        reassignedFrom: oldTechnician?._id,
        reassignedTo: newTechnician._id,
        reassignmentReason: reason
      };

      if (!task.statusLog) {
        task.statusLog = [];
      }
      task.statusLog.push(reassignmentLog);

      await task.save();

      // Populate the updated task
      const updatedTask = await Task.findById(task._id)
        .populate('assignedTo', 'name email')
        .populate('project', 'siteName clientName')
        .populate('assignedBy', 'name email');

      // Send notifications
      try {
        await notificationService.notifyTaskReassigned(
          updatedTask,
          newTechnician,
          oldTechnician,
          req.user
        );
        console.log('✅ Task reassignment notifications sent successfully');
      } catch (notificationError) {
        console.error('❌ Failed to send reassignment notifications:', notificationError);
        // Don't fail the request if notification fails
      }

      // Emit socket event for real-time updates
      if (global.socketServer) {
        try {
          // Emit task reassigned event
          global.socketServer.io.emit('task_reassigned', {
            task: updatedTask,
            oldTechnician: oldTechnician,
            newTechnician: newTechnician,
            reassignedBy: req.user
          });
        } catch (socketError) {
          console.error('❌ Error emitting socket event:', socketError);
        }
      }

      res.json({
        status: 'success',
        message: 'Task reassigned successfully',
        data: updatedTask
      });
    } catch (error) {
      console.error('Error reassigning task:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reassign task',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Create and assign a new task (Manager only)
router.post('/',
  protect,
  authorize('manager'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('assignedTo').notEmpty().withMessage('Technician ID is required'),
    body('description').optional().isString(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title, description, project, assignedTo, priority = 'medium', deadline } = req.body;

      // Check project exists and belongs to manager
      const foundProject = await Project.findById(project);
      if (!foundProject) {
        return res.status(404).json({ status: 'error', message: 'Project not found' });
      }
      if (foundProject.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'Not authorized for this project' });
      }

      // Check technician exists
      const technician = await User.findById(assignedTo);
      if (!technician || technician.role !== 'technician') {
        return res.status(404).json({ status: 'error', message: 'Technician not found' });
      }

      // Create task
      const newTask = new Task({
        title,
        description,
        project: foundProject._id,
        assignedTo: technician._id,
        assignedBy: req.user.id,
        priority,
        deadline
      });
      await newTask.save();

      // Add task to project's tasks array
      foundProject.tasks.push(newTask._id);
      await foundProject.save();

      // Populate task for notifications
      const populatedTask = await Task.findById(newTask._id)
        .populate('project', 'siteName clientName')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');

      // Send comprehensive notifications using standardized method
      try {
        await notificationService.notifyTaskCreated(populatedTask, req.user, technician);
        console.log('✅ Task creation notifications sent successfully');
        
        // Also emit socket event for real-time updates
        if (global.socketServer) {
          global.socketServer.emitTaskAssigned(populatedTask, technician, req.user);
        }
      } catch (notificationError) {
        console.error('❌ Failed to send task creation notifications:', notificationError);
        // Don't fail the request if notification fails
      }

      res.status(201).json({
        status: 'success',
        data: newTask,
        message: 'Task created and assigned successfully'
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create task',
        error: error.message
      });
    }
  }
);

// Log registered routes for debugging
console.log('✅ Tasks routes registered:');
console.log('  - POST /api/tasks/:taskId/reassign (SuperAdmin only)');
console.log('  - POST /api/tasks/ (Manager only)');

module.exports = router; 