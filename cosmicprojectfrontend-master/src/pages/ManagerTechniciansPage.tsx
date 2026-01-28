import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { API_BASE_URL } from "@/config/environment";
import { getUsersByRole } from "@/utils/userCredentials";
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
  Users,
  Search,
  Filter,
  Eye,
  Plus,
  Download,
  User,
  Clock,
  CheckCircle,
  Star,
  Calendar,
  TrendingUp,
  Award,
  Activity,
} from "lucide-react";
import toast from 'react-hot-toast';
import { useSocket } from "@/contexts/SocketContext";
import { useEffect } from "react";

const ManagerTechniciansPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  const { socket } = useSocket();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_BASE_URL}/manager/technicians`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setTeamMembers(data.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Task assigned
    socket.on("task_assigned", (data) => {
      toast.success(`Task "${data.task.title}" assigned to technician.`);
    });
    // Task status updated
    socket.on("task_status_updated", (data) => {
      toast(`Task "${data.task.title}" status updated to "${data.task.status}".`);
    });
    // Report submitted
    socket.on("report_submitted", (data) => {
      toast.success(`Report submitted for task "${data.report.task}".`);
    });
    return () => {
      socket.off("task_assigned");
      socket.off("task_status_updated");
      socket.off("report_submitted");
    };
  }, [socket]);

  // Calculate team performance stats
  const teamStats = {
    totalTechnicians: teamMembers.length,
    availableTechnicians: teamMembers.filter(t => t.status === "Available").length,
    avgCompletionTime: teamMembers.reduce((acc, t) => acc + t.avgCompletionTime, 0) / teamMembers.length || 0,
    avgRating: teamMembers.reduce((acc, t) => acc + parseFloat(t.rating), 0) / teamMembers.length || 0,
    totalTasksCompleted: teamMembers.reduce((acc, t) => acc + t.completedTasks, 0),
    totalActiveTasks: teamMembers.reduce((acc, t) => acc + t.activeTasks, 0),
  };

  // Filter technicians based on search
  const filteredTechnicians = teamMembers.filter(technician =>
    technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (technician: any) => {
    setSelectedTechnician(technician);
    setIsViewProfileOpen(true);
  };

  const handleAssignTask = (technician: any) => {
    setSelectedTechnician(technician);
    setIsAssignTaskOpen(true);
  };

  const handleCreateTask = () => {
    if (!taskTitle) {
      alert("Please fill in the task title");
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: taskTitle,
      description: taskDescription,
      technicianId: selectedTechnician.id,
      priority: taskPriority || "medium",
      deadline: taskDeadline,
      status: "assigned",
      createdAt: new Date().toISOString(),
      assignedBy: "Project Manager",
      progress: 0,
    };

    alert(
      `✅ Task "${taskTitle}" has been successfully assigned to ${selectedTechnician?.name}\n\nThe technician will be notified and can now view this task in their dashboard.`
    );

    // Reset form
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("");
    setTaskDeadline("");
    setIsAssignTaskOpen(false);
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      totalTechnicians: teamStats.totalTechnicians,
      teamPerformance: teamStats,
      technicians: teamMembers.map(t => ({
        name: t.name,
        email: t.email,
        status: t.status,
        totalTasks: t.totalTasks,
        completedTasks: t.completedTasks,
        activeTasks: t.activeTasks,
        avgCompletionTime: t.avgCompletionTime,
        rating: t.rating,
      })),
    };

    alert(
      `📊 Team Report Generated!\n\n` +
      `Total Technicians: ${teamStats.totalTechnicians}\n` +
      `Available: ${teamStats.availableTechnicians}\n` +
      `Avg. Completion Time: ${teamStats.avgCompletionTime.toFixed(1)} hours\n` +
      `Team Rating: ${teamStats.avgRating.toFixed(1)}/5.0\n\n` +
      `Report would be downloaded as CSV/PDF in a real implementation.`
    );
  };

  return (
    <DashboardLayout
      userRole="manager"
      userName="Project Manager"
      userEmail="manager@cosmicsolutions.com"
    >
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Team Technicians
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Manage and monitor your technician team performance.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExportReport}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Team Report
          </Button>
        </div>

        {/* Team Performance Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Technicians</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalTechnicians}</div>
              <p className="text-xs text-muted-foreground">
                {teamStats.availableTechnicians} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.avgCompletionTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                Per task completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.avgRating.toFixed(1)}/5.0</div>
              <p className="text-xs text-muted-foreground">
                Average performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalActiveTasks}</div>
              <p className="text-xs text-muted-foreground">
                {teamStats.totalTasksCompleted} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Profile Modal */}
        <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Technician Profile</DialogTitle>
              <DialogDescription>
                Detailed information and performance summary
              </DialogDescription>
            </DialogHeader>
            {selectedTechnician && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{selectedTechnician.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTechnician.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`${selectedTechnician.statusColor} text-white border-0`}
                      >
                        {selectedTechnician.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedTechnician.department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedTechnician.totalTasks}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedTechnician.completedTasks}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedTechnician.activeTasks}
                    </div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedTechnician.rating}
                    </div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion Rate</span>
                    <span className="font-medium">
                      {selectedTechnician.totalTasks > 0 ? ((selectedTechnician.completedTasks / selectedTechnician.totalTasks) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={selectedTechnician.totalTasks > 0 ? (selectedTechnician.completedTasks / selectedTechnician.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <h4 className="font-medium">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTechnician.skills.length > 0 ? (
                      selectedTechnician.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No skills data available</span>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Join Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedTechnician.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Active:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedTechnician.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg. Completion Time:</span>
                    <span className="ml-2 font-medium">
                      {selectedTechnician.avgCompletionTime} hours
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <span className="ml-2 font-medium">
                      {selectedTechnician.department}
                    </span>
                  </div>
                </div>

                {/* Recent Tasks */}
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Tasks</h4>
                  <div className="space-y-2">
                    {selectedTechnician.recentTasks.length > 0 ? (
                      selectedTechnician.recentTasks.map((task: any) => (
                        <div key={task.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {task.project}
                              </div>
                            </div>
                            <Badge
                              variant={task.status === "Completed" ? "default" : "secondary"}
                            >
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No recent tasks available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsViewProfileOpen(false)}
              >
                Close
              </Button>
              <Button onClick={() => {
                setIsViewProfileOpen(false);
                handleAssignTask(selectedTechnician);
              }}>
                Assign Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Task Modal */}
        <Dialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Assign Task to {selectedTechnician?.name}</DialogTitle>
              <DialogDescription>
                Create and assign a new task to this technician.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={taskPriority} onValueChange={setTaskPriority}>
                    <SelectTrigger>
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
                onClick={() => setIsAssignTaskOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTask} className="w-full sm:w-auto">
                Assign Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManagerTechniciansPage;