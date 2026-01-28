// File: src/services/notificationService.js

class NotificationService {
    constructor() {
        // Always enabled - notifications should work in all environments
        this.isEnabled = true;
    }

    // Send real-time notification using socket server
    async sendRealTimeNotification(userId, notification) {
        try {
            if (global.socketServer) {
                console.log(`Sending real-time notification to user ${userId}:`, notification);
                const result = await global.socketServer.sendNotificationToUser(userId, notification);
                console.log(`✅ Notification sent successfully to user ${userId}`);
                return result;
            } else {
                console.warn('Socket server not available, saving notification to database only');
                return await this.saveNotificationToDatabase(userId, notification);
            }
        } catch (error) {
            console.error('Error sending real-time notification:', error);
            // Fallback to database only
            try {
                return await this.saveNotificationToDatabase(userId, notification);
            } catch (dbError) {
                console.error('Failed to save notification to database:', dbError);
                throw error;
            }
        }
    }

    // Send notification to multiple users
    async sendNotificationToUsers(userIds, notification) {
        try {
            // Always save to database first
            const dbPromises = userIds.map(userId => this.saveNotificationToDatabase(userId, notification));
            const dbResults = await Promise.all(dbPromises);
            
            // Then send via socket if available
            if (global.socketServer) {
                try {
                    await global.socketServer.sendNotificationToUsers(userIds, notification);
                } catch (socketError) {
                    console.warn('Socket notification failed, but notifications saved to DB:', socketError.message);
                }
            }
            
            return dbResults;
        } catch (error) {
            console.error('Error sending notifications to users:', error);
            throw error;
        }
    }

    // Send notification to role
    async sendNotificationToRole(role, notification) {
        try {
            // Always save to database first
            const dbResults = await this.saveNotificationToRole(role, notification);
            
            // Then send via socket if available
            if (global.socketServer) {
                try {
                    await global.socketServer.sendNotificationToRole(role, notification);
                } catch (socketError) {
                    console.warn('Socket notification failed, but notification saved to DB:', socketError.message);
                }
            }
            
            return dbResults;
        } catch (error) {
            console.error('Error sending notification to role:', error);
            throw error;
        }
    }

    // Save notification to database only
    async saveNotificationToDatabase(userId, notification) {
        const Notification = require('../models/Notification');
        return await Notification.create({
            userId,
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info',
            priority: notification.priority || 'medium',
            category: notification.category || 'general',
            metadata: notification.metadata || {}
        });
    }

    // Save notification to database for role
    async saveNotificationToRole(role, notification) {
        const User = require('../models/User');
        const users = await User.find({ role }).select('_id');
        const userIds = users.map(user => user._id.toString());
        
        const promises = userIds.map(userId => this.saveNotificationToDatabase(userId, notification));
        return Promise.all(promises);
    }

    // ========================================
    // GLOBAL NOTIFICATION SYSTEM
    // Rule: SuperAdmin MUST be notified for ALL important actions
    // ========================================

    /**
     * Send notifications for Project Creation
     * Notifies: Creator, Assigned Manager, ALL SuperAdmins
     */
    async notifyProjectCreated(project, createdBy, assignedManager) {
        const notifications = [];
        
        // 1. Notify the creator (SuperAdmin or Manager)
        notifications.push(
            this.sendRealTimeNotification(createdBy._id.toString(), {
                title: 'Project Created Successfully',
                message: `You have successfully created project "${project.siteName || project.title}"`,
                type: 'success',
                priority: 'high',
                category: 'project',
                metadata: {
                    projectId: project._id,
                    action: 'created'
                }
            })
        );
        
        // 2. Notify the assigned manager (if different from creator)
        if (assignedManager && assignedManager.toString() !== createdBy._id.toString()) {
            notifications.push(
                this.sendRealTimeNotification(assignedManager.toString(), {
                    title: 'New Project Assigned',
                    message: `You have been assigned a new project: "${project.siteName || project.title}"`,
                    type: 'info',
                    priority: 'high',
                    category: 'project',
                    metadata: {
                        projectId: project._id,
                        action: 'assigned',
                        assignedBy: createdBy._id
                    }
                })
            );
        }
        
        // 3. ALWAYS notify ALL SuperAdmins (including the creator if they are superadmin)
        // This ensures all superadmins are aware of project creation
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: 'New Project Created',
                message: `Project "${project.siteName || project.title}" created by ${createdBy.name}`,
                type: 'info',
                priority: 'medium',
                category: 'project',
                metadata: {
                    projectId: project._id,
                    createdBy: createdBy._id,
                    action: 'created'
                }
            })
        );
        
        return Promise.all(notifications);
    }

    /**
     * Send notifications for Project Status Change
     * Notifies: Updater, Assigned Manager (if different), ALL SuperAdmins
     */
    async notifyProjectStatusChanged(project, newStatus, changedBy) {
        const notifications = [];
        
        // 1. Notify the person who made the change
        notifications.push(
            this.sendRealTimeNotification(changedBy._id.toString(), {
                title: 'Project Status Updated',
                message: `You changed "${project.siteName || project.title}" status to ${newStatus}`,
                type: 'success',
                priority: 'medium',
                category: 'project',
                metadata: {
                    projectId: project._id,
                    newStatus,
                    action: 'status_changed'
                }
            })
        );
        
        // 2. Notify assigned manager (if different from updater)
        if (project.assignedManager && project.assignedManager.toString() !== changedBy._id.toString()) {
            notifications.push(
                this.sendRealTimeNotification(project.assignedManager.toString(), {
                    title: 'Project Status Changed',
                    message: `Project "${project.siteName || project.title}" status changed to ${newStatus}`,
                    type: 'info',
                    priority: 'medium',
                    category: 'project',
                    metadata: {
                        projectId: project._id,
                        newStatus,
                        changedBy: changedBy._id,
                        action: 'status_changed'
                    }
                })
            );
        }
        
        // 3. ALWAYS notify ALL SuperAdmins (including the updater if they are superadmin)
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: 'Project Status Changed',
                message: `"${project.siteName || project.title}" status changed to ${newStatus} by ${changedBy.name}`,
                type: 'info',
                priority: 'medium',
                category: 'project',
                metadata: {
                    projectId: project._id,
                    newStatus,
                    changedBy: changedBy._id,
                    action: 'status_changed'
                }
            })
        );
        
        return Promise.all(notifications);
    }

    /**
     * Send notifications for Task Creation
     * Notifies: Creator (Manager), Assigned Technician, ALL SuperAdmins
     */
    async notifyTaskCreated(task, createdBy, assignedTechnician) {
        const notifications = [];
        
        // 1. Notify the creator (Manager)
        notifications.push(
            this.sendRealTimeNotification(createdBy._id.toString(), {
                title: 'Task Created Successfully',
                message: `You created and assigned task "${task.title}" to ${assignedTechnician.name}`,
                type: 'success',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    action: 'created'
                }
            })
        );
        
        // 2. Notify the assigned technician
        notifications.push(
            this.sendRealTimeNotification(assignedTechnician._id.toString(), {
                title: 'New Task Assigned',
                message: `You have been assigned task: "${task.title}"`,
                type: 'info',
                priority: task.priority || 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    assignedBy: createdBy._id,
                    action: 'assigned'
                }
            })
        );
        
        // 3. ALWAYS notify ALL SuperAdmins
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: 'New Task Created',
                message: `Task "${task.title}" created and assigned to ${assignedTechnician.name}`,
                type: 'info',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    createdBy: createdBy._id,
                    assignedTo: assignedTechnician._id,
                    action: 'created'
                }
            })
        );
        
        return Promise.all(notifications);
    }

    /**
     * Send notifications for Task Status Update
     * Notifies: Updater (Technician), Assigning Manager, ALL SuperAdmins
     */
    async notifyTaskStatusChanged(task, newStatus, updatedBy, assignedByManager) {
        const notifications = [];
        
        // 1. Notify the person who updated (Technician)
        notifications.push(
            this.sendRealTimeNotification(updatedBy._id.toString(), {
                title: 'Task Status Updated',
                message: `You updated task "${task.title}" status to ${newStatus}`,
                type: 'success',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    newStatus,
                    action: 'status_changed'
                }
            })
        );
        
        // 2. Notify the manager who assigned the task
        if (assignedByManager && assignedByManager.toString() !== updatedBy._id.toString()) {
            notifications.push(
                this.sendRealTimeNotification(assignedByManager.toString(), {
                    title: 'Task Status Changed',
                    message: `Task "${task.title}" status changed to ${newStatus} by ${updatedBy.name}`,
                    type: 'info',
                    priority: 'medium',
                    category: 'task',
                    metadata: {
                        taskId: task._id,
                        projectId: task.project,
                        newStatus,
                        updatedBy: updatedBy._id,
                        action: 'status_changed'
                    }
                })
            );
        }
        
        // 3. ALWAYS notify ALL SuperAdmins
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: 'Task Status Updated',
                message: `Task "${task.title}" status changed to ${newStatus} by ${updatedBy.name}`,
                type: 'info',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    newStatus,
                    updatedBy: updatedBy._id,
                    action: 'status_changed'
                }
            })
        );
        
        return Promise.all(notifications);
    }

    /**
     * Send notifications for Task Reassignment
     * Notifies: New Technician, Old Technician, Reassigner, ALL SuperAdmins
     */
    async notifyTaskReassigned(task, newTechnician, oldTechnician, reassignedBy) {
        const notifications = [];
        
        // 1. Notify the new technician
        notifications.push(
            this.sendRealTimeNotification(newTechnician._id.toString(), {
                title: 'Task Assigned to You',
                message: `Task "${task.title}" has been reassigned to you`,
                type: 'info',
                priority: 'high',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    reassignedBy: reassignedBy._id,
                    action: 'reassigned'
                }
            })
        );
        
        // 2. Notify the old technician (if exists)
        if (oldTechnician && oldTechnician._id) {
            notifications.push(
                this.sendRealTimeNotification(oldTechnician._id.toString(), {
                    title: 'Task Reassigned',
                    message: `Task "${task.title}" has been reassigned to ${newTechnician.name}`,
                    type: 'warning',
                    priority: 'medium',
                    category: 'task',
                    metadata: {
                        taskId: task._id,
                        projectId: task.project,
                        reassignedTo: newTechnician._id,
                        action: 'reassigned'
                    }
                })
            );
        }
        
        // 3. Notify the person who reassigned (if not the new technician)
        if (reassignedBy._id.toString() !== newTechnician._id.toString()) {
            notifications.push(
                this.sendRealTimeNotification(reassignedBy._id.toString(), {
                    title: 'Task Reassigned Successfully',
                    message: `You reassigned task "${task.title}" to ${newTechnician.name}`,
                    type: 'success',
                    priority: 'medium',
                    category: 'task',
                    metadata: {
                        taskId: task._id,
                        projectId: task.project,
                        action: 'reassigned'
                    }
                })
            );
        }
        
        // 4. ALWAYS notify ALL SuperAdmins (including the reassigner if they are superadmin)
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: 'Task Reassigned',
                message: `Task "${task.title}" reassigned from ${oldTechnician?.name || 'N/A'} to ${newTechnician.name} by ${reassignedBy.name}`,
                type: 'info',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    reassignedBy: reassignedBy._id,
                    action: 'reassigned'
                }
            })
        );
        
        return Promise.all(notifications);
    }

    /**
     * Send notifications for Task Delay
     * Notifies: Technician, Manager, ALL SuperAdmins
     */
    async notifyTaskDelayed(task, delayReason, delayedBy) {
        const notifications = [];
        
        // 1. Notify the person who marked it delayed
        notifications.push(
            this.sendRealTimeNotification(delayedBy._id.toString(), {
                title: 'Task Marked as Delayed',
                message: `You marked task "${task.title}" as delayed`,
                type: 'warning',
                priority: 'high',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    delayReason,
                    action: 'delayed'
                }
            })
        );
        
        // 2. Notify the manager who assigned the task
        if (task.assignedBy && task.assignedBy.toString() !== delayedBy._id.toString()) {
            notifications.push(
                this.sendRealTimeNotification(task.assignedBy.toString(), {
                    title: '⚠️ Task Delayed',
                    message: `Task "${task.title}" has been marked as delayed. Reason: ${delayReason}`,
                    type: 'warning',
                    priority: 'high',
                    category: 'task',
                    metadata: {
                        taskId: task._id,
                        projectId: task.project,
                        delayReason,
                        delayedBy: delayedBy._id,
                        action: 'delayed'
                    }
                })
            );
        }
        
        // 3. ALWAYS notify ALL SuperAdmins
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: '⚠️ Task Delayed',
                message: `Task "${task.title}" delayed by ${delayedBy.name}. Reason: ${delayReason}`,
                type: 'warning',
                priority: 'high',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    delayReason,
                    delayedBy: delayedBy._id,
                    action: 'delayed'
                }
            })
        );
        
        return Promise.all(notifications);
    }

    /**
     * Send notifications for Task Completion
     * Notifies: Technician, Manager, ALL SuperAdmins
     */
    async notifyTaskCompleted(task, completedBy) {
        const notifications = [];
        
        // 1. Notify the person who completed it
        notifications.push(
            this.sendRealTimeNotification(completedBy._id.toString(), {
                title: '✅ Task Completed',
                message: `You marked task "${task.title}" as completed`,
                type: 'success',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    action: 'completed'
                }
            })
        );
        
        // 2. Notify the manager who assigned the task
        if (task.assignedBy && task.assignedBy.toString() !== completedBy._id.toString()) {
            notifications.push(
                this.sendRealTimeNotification(task.assignedBy.toString(), {
                    title: '✅ Task Completed',
                    message: `Task "${task.title}" has been completed by ${completedBy.name}`,
                    type: 'success',
                    priority: 'medium',
                    category: 'task',
                    metadata: {
                        taskId: task._id,
                        projectId: task.project,
                        completedBy: completedBy._id,
                        action: 'completed'
                    }
                })
            );
        }
        
        // 3. ALWAYS notify ALL SuperAdmins
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: '✅ Task Completed',
                message: `Task "${task.title}" completed by ${completedBy.name}`,
                type: 'success',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    completedBy: completedBy._id,
                    action: 'completed'
                }
            })
        );
        
        return Promise.all(notifications);
    }
    async sendTaskAssignedNotification(technicianId, task, assignedBy) {
        return await this.sendRealTimeNotification(technicianId, {
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${task.title}`,
            type: 'info',
            priority: task.priority || 'medium',
            category: 'task',
            metadata: {
                taskId: task._id,
                projectId: task.project,
                assignedBy: assignedBy._id
            }
        });
    }

    async sendTaskCompletedNotification(managerId, task, completedBy) {
        return await this.sendRealTimeNotification(managerId, {
            title: 'Task Completed',
            message: `Task "${task.title}" has been completed by ${completedBy.name}`,
            type: 'success',
            priority: 'medium',
            category: 'task',
            metadata: {
                taskId: task._id,
                projectId: task.project,
                completedBy: completedBy._id
            }
        });
    }

    async sendTaskUpdatedNotification(task, updatedBy) {
        // Notify manager and super admins about task update
        const notifications = [];
        
        // Notify the task assignee if updated by someone else
        if (task.assignedTo && task.assignedTo._id.toString() !== updatedBy._id.toString()) {
            notifications.push(
                this.sendRealTimeNotification(task.assignedTo._id.toString(), {
                    title: 'Task Updated',
                    message: `Task "${task.title}" has been updated`,
                    type: 'info',
                    priority: 'medium',
                    category: 'task',
                    metadata: {
                        taskId: task._id,
                        projectId: task.project,
                        updatedBy: updatedBy._id
                    }
                })
            );
        }
        
        // Notify super admins
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: 'Task Updated',
                message: `Task "${task.title}" has been updated`,
                type: 'info',
                priority: 'medium',
                category: 'task',
                metadata: {
                    taskId: task._id,
                    projectId: task.project,
                    updatedBy: updatedBy._id
                }
            })
        );
        
        return Promise.all(notifications);
    }

    // Project-related notifications
    async sendProjectCreatedNotification(project, createdBy) {
        return await this.sendNotificationToRole('superadmin', {
            title: 'New Project Created',
            message: `A new project "${project.siteName || project.title}" has been created by ${createdBy.name}`,
            type: 'info',
            priority: 'medium',
            category: 'project',
            metadata: {
                projectId: project._id,
                createdBy: createdBy._id
            }
        });
    }

    async sendProjectUpdatedNotification(project, updatedBy) {
        // Notify manager and super admins about project update
        const notifications = [];
        
        // Notify the assigned manager
        if (project.assignedManager) {
            const managerId = project.assignedManager._id || project.assignedManager;
            notifications.push(
                this.sendRealTimeNotification(managerId.toString(), {
                    title: 'Project Updated',
                    message: `Project "${project.siteName || project.title}" has been updated`,
                    type: 'info',
                    priority: 'medium',
                    category: 'project',
                    metadata: {
                        projectId: project._id,
                        updatedBy: updatedBy._id
                    }
                })
            );
        }
        
        // Notify super admins
        notifications.push(
            this.sendNotificationToRole('superadmin', {
                title: 'Project Updated',
                message: `Project "${project.siteName || project.title}" has been updated`,
                type: 'info',
                priority: 'medium',
                category: 'project',
                metadata: {
                    projectId: project._id,
                    updatedBy: updatedBy._id
                }
            })
        );
        
        return Promise.all(notifications);
    }

    async sendProjectStatusChangedNotification(project, newStatus, changedBy) {
        return await this.sendNotificationToRole('superadmin', {
            title: 'Project Status Updated',
            message: `Project "${project.siteName || project.title}" status changed to ${newStatus} by ${changedBy.name}`,
            type: 'info',
            priority: 'medium',
            category: 'project',
            metadata: {
                projectId: project._id,
                newStatus,
                changedBy: changedBy._id
            }
        });
    }

    // Report-related notifications
    async sendReportSubmittedNotification(managerId, report, submittedBy) {
        return await this.sendRealTimeNotification(managerId, {
            title: 'Report Submitted',
            message: `A new report has been submitted by ${submittedBy.name}`,
            type: 'success',
            priority: 'medium',
            category: 'report',
            metadata: {
                reportId: report._id,
                submittedBy: submittedBy._id
            }
        });
    }

    // System notifications
    async sendSystemMaintenanceNotification(message) {
        if (global.socketServer) {
            global.socketServer.emitSystemMaintenance(message);
        }
        console.log(`[SYSTEM MAINTENANCE] ${message}`);
    }

    async sendSystemAlertNotification(message) {
        if (global.socketServer) {
            global.socketServer.emitSystemAlert(message);
        }
        console.log(`[SYSTEM ALERT] ${message}`);
    }

    // Email notifications (for future use)
    async sendWelcomeEmail(email, name) {
        if (!this.isEnabled) {
            console.log(`[NOTIFICATION] Welcome email would be sent to: ${email} (Name: ${name})`);
            return { success: true, method: 'console' };
        }
        
        // Add actual email logic here when needed
        return { success: true, method: 'email' };
    }

    async sendPasswordResetEmail(email, resetToken) {
        if (!this.isEnabled) {
            console.log(`[NOTIFICATION] Password reset email would be sent to: ${email} (Token: ${resetToken})`);
            return { success: true, method: 'console' };
        }
        
        // Add actual email logic here when needed
        return { success: true, method: 'email' };
    }

    async sendNotification(email, subject, message) {
        if (!this.isEnabled) {
            console.log(`[NOTIFICATION] Email notification:`);
            console.log(`  To: ${email}`);
            console.log(`  Subject: ${subject}`);
            console.log(`  Message: ${message}`);
            return { success: true, method: 'console' };
        }
        
        // Add actual email logic here when needed
        return { success: true, method: 'email' };
    }

    async sendUserUpdateNotification(userId, updateType, data) {
        if (!this.isEnabled) {
            console.log(`[NOTIFICATION] User update notification:`);
            console.log(`  User ID: ${userId}`);
            console.log(`  Update Type: ${updateType}`);
            console.log(`  Data:`, data);
            return { success: true, method: 'console' };
        }
        
        // Add actual notification logic here when needed
        return { success: true, method: 'notification' };
    }

    // Method to send account verification email
    async sendVerificationEmail(email, verificationToken) {
        if (!this.isEnabled) {
            console.log(`[NOTIFICATION] Verification email would be sent to: ${email} (Token: ${verificationToken})`);
            return { success: true, method: 'console' };
        }
        
        // Add actual email logic here when needed
        return { success: true, method: 'email' };
    }

    // Method to send account deletion confirmation
    async sendAccountDeletionConfirmation(email, userName) {
        if (!this.isEnabled) {
            console.log(`[NOTIFICATION] Account deletion confirmation would be sent to: ${email} (User: ${userName})`);
            return { success: true, method: 'console' };
        }
        
        // Add actual email logic here when needed
        return { success: true, method: 'email' };
    }
}

module.exports = new NotificationService();