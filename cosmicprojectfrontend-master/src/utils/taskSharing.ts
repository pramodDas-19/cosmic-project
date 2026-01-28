// Task sharing system for Super Admin → Manager → Technician workflow

export interface Project {
  id: string;
  clientName: string;
  siteName: string;
  location: string;
  mapLink?: string;
  priority: string;
  deadline: string;
  description: string;
  notes: string;
  assignedManager: string;
  assignedManagerId: string;
  status: string;
  progress: number;
  tasksCount: number;
  completedTasks: number;
  createdAt: string;
  files: any[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assignedTo: string;
  assignedToId: string;
  assignedBy: string;
  assignedById: string;
  priority: string;
  status: "assigned" | "in_progress" | "completed" | "delayed";
  deadline: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  files: any[];
  comments: Array<{
    user: string;
    comment: string;
    timestamp: string;
  }>;
}

// In-memory storage (in a real app, this would be a database)
class TaskSharingService {
  private projects: Project[] = [];
  private tasks: Task[] = [];

  // Project management
  addProject(project: Project): void {
    this.projects.push(project);
    this.notifyProjectAssignment(project);
  }

  getProjectsByManager(managerId: string): Project[] {
    return this.projects.filter((p) => p.assignedManagerId === managerId);
  }

  getAllProjects(): Project[] {
    return this.projects;
  }

  updateProject(projectId: string, updates: Partial<Project>): void {
    const index = this.projects.findIndex((p) => p.id === projectId);
    if (index !== -1) {
      this.projects[index] = { ...this.projects[index], ...updates };
    }
  }

  // Task management
  addTask(task: Task): void {
    this.tasks.push(task);
    this.updateProjectTaskCount(task.projectId);
    this.notifyTaskAssignment(task);
  }

  getTasksByTechnician(technicianId: string): Task[] {
    return this.tasks.filter((t) => t.assignedToId === technicianId);
  }

  getTasksByManager(managerId: string): Task[] {
    return this.tasks.filter((t) => t.assignedById === managerId);
  }

  getAllTasks(): Task[] {
    return this.tasks;
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const oldTask = this.tasks[index];
      this.tasks[index] = {
        ...oldTask,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update project progress
      this.updateProjectProgress(oldTask.projectId);

      // Notify about status changes
      if (updates.status && updates.status !== oldTask.status) {
        this.notifyTaskStatusChange(this.tasks[index]);
      }
    }
  }

  getTasksByProject(projectId: string): Task[] {
    return this.tasks.filter((t) => t.projectId === projectId);
  }

  // Helper methods
  private updateProjectTaskCount(projectId: string): void {
    const projectTasks = this.getTasksByProject(projectId);
    const completedTasks = projectTasks.filter(
      (t) => t.status === "completed",
    ).length;

    this.updateProject(projectId, {
      tasksCount: projectTasks.length,
      completedTasks: completedTasks,
      progress:
        projectTasks.length > 0
          ? Math.round((completedTasks / projectTasks.length) * 100)
          : 0,
    });
  }

  private updateProjectProgress(projectId: string): void {
    const projectTasks = this.getTasksByProject(projectId);
    const completedTasks = projectTasks.filter(
      (t) => t.status === "completed",
    ).length;

    this.updateProject(projectId, {
      completedTasks: completedTasks,
      progress:
        projectTasks.length > 0
          ? Math.round((completedTasks / projectTasks.length) * 100)
          : 0,
    });
  }

  // Notification methods (in a real app, these would trigger actual notifications)
  private notifyProjectAssignment(project: Project): void {
    console.log(
      `📋 Project assigned: "${project.siteName}" to manager ${project.assignedManager}`,
    );
  }

  private notifyTaskAssignment(task: Task): void {
    console.log(
      `📝 Task assigned: "${task.title}" to technician ${task.assignedTo}`,
    );
  }

  private notifyTaskStatusChange(task: Task): void {
    console.log(
      `🔄 Task status updated: "${task.title}" is now ${task.status}`,
    );
  }

  // Analytics and reporting
  getAnalytics(role: string, userId?: string) {
    if (role === "super-admin") {
      return {
        totalProjects: this.projects.length,
        totalTasks: this.tasks.length,
        completedTasks: this.tasks.filter((t) => t.status === "completed")
          .length,
        pendingTasks: this.tasks.filter((t) =>
          ["assigned", "in_progress"].includes(t.status),
        ).length,
        delayedTasks: this.tasks.filter((t) => t.status === "delayed").length,
      };
    } else if (role === "manager" && userId) {
      const managerProjects = this.getProjectsByManager(userId);
      const managerTasks = this.getTasksByManager(userId);
      return {
        assignedProjects: managerProjects.length,
        totalTasks: managerTasks.length,
        completedTasks: managerTasks.filter((t) => t.status === "completed")
          .length,
        pendingTasks: managerTasks.filter((t) =>
          ["assigned", "in_progress"].includes(t.status),
        ).length,
        delayedTasks: managerTasks.filter((t) => t.status === "delayed").length,
      };
    } else if (role === "technician" && userId) {
      const technicianTasks = this.getTasksByTechnician(userId);
      return {
        assignedTasks: technicianTasks.filter((t) => t.status === "assigned")
          .length,
        inProgressTasks: technicianTasks.filter(
          (t) => t.status === "in_progress",
        ).length,
        completedTasks: technicianTasks.filter((t) => t.status === "completed")
          .length,
        delayedTasks: technicianTasks.filter((t) => t.status === "delayed")
          .length,
      };
    }
    return {};
  }

  // Reset all data (for development/testing)
  reset(): void {
    this.projects = [];
    this.tasks = [];
  }
}

// Singleton instance
export const taskSharingService = new TaskSharingService();

// Export types for components
export type { Project, Task };
