import DashboardLayout from "@/components/dashboard/DashboardLayout";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/environment";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle,
  Pause,
  AlertCircle,
  User,
  MapPin,
  Calendar,
  Eye,
  BarChart3,
  FileText,
  ClipboardList,
  Search,
  Filter,
  LayoutGrid,
  List,
  X,
  Users,
  TrendingUp,
} from "lucide-react";
import toast from 'react-hot-toast';
import { useSocket } from "@/contexts/SocketContext";

const MyProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const [isGanttChartOpen, setIsGanttChartOpen] = useState(false);

  const [assignedProjects, setAssignedProjects] = useState([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [report, setReport] = useState(null);

  const { socket } = useSocket();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Fetch manager's assigned projects (correct port)
    fetch(`${API_BASE_URL}/manager/projects`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setAssignedProjects(data.data);
        }
      })
      .catch(console.error);

    // Fetch reports
    fetch(`${API_BASE_URL}/reports/overview`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setReport(data.data);
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
      toast(`Task "${data.task.title}" status updated to "${data.task.status}".`);
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

  const filteredProjects = assignedProjects.filter((project) => {
    const matchesSearch =
      project.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (project.status || "active").toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsProjectDetailsOpen(true);
  };

  const handleViewGanttChart = () => {
    setIsGanttChartOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Active":
        return <Clock className="h-4 w-4" />;
      case "Completed":
        return <CheckCircle className="h-4 w-4" />;
      case "On Hold":
        return <Pause className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-orange-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const ProjectCard = ({ project }) => (
    <div className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{project.siteName}</h4>
            <Badge
              className={`${getPriorityColor(
                project.priority,
              )} text-white border-0 text-xs`}
            >
              {project.priority}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                {new Date(project.startDate).toLocaleDateString()} -{" "}
                {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`${
              project.statusColor
            } text-white border-0 flex items-center gap-1`}
          >
            {getStatusIcon(project.status)}
            {project.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewProject(project)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Budget:</span>
          <span className="font-medium ml-2">{project.budget}</span>
        </div>
        <div>
          <span className="text-gray-600">Team Size:</span>
          <span className="font-medium ml-2">{project.teamSize} members</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Tasks: {project.completedTasks}/{project.tasksCount}
          </span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </div>

      <div className="mt-3 text-xs text-gray-600">
        Last updated: {new Date(project.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  );

  const ProjectTableRow = ({ project }) => (
    <TableRow key={project.id}>
      <TableCell>
        <div>
          <div className="font-medium">{project.name}</div>
          <div className="text-sm text-gray-600">{project.client}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{project.location}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{new Date(project.startDate).toLocaleDateString()}</div>
          <div className="text-gray-600">
            to {new Date(project.endDate).toLocaleDateString()}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          className={`${
            project.statusColor
          } text-white border-0 flex items-center gap-1 w-fit`}
        >
          {getStatusIcon(project.status)}
          {project.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>
              {project.completedTasks}/{project.tasksCount}
            </span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewProject(project)}
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <DashboardLayout
      userRole="manager"
      userName="Project Manager"
      userEmail="manager@cosmicsolutions.com"
    >
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              My Projects
            </h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">
              Manage and track all your assigned projects.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignedProjects.length}
              </div>
              <p className="text-xs text-gray-600">All assigned projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  assignedProjects.filter(
                    (p) =>
                      !p.status ||
                      p.status === "Active" ||
                      p.status === "Planning" ||
                      p.status === "In Progress",
                  ).length
                }
              </div>
              <p className="text-xs text-gray-600">Currently in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  assignedProjects.filter(
                    (p) => p.status === "Completed" || p.status === "Done",
                  ).length
                }
              </div>
              <p className="text-xs text-gray-600">Successfully finished</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Hold</CardTitle>
              <Pause className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  assignedProjects.filter(
                    (p) => p.status === "On Hold" || p.status === "Paused",
                  ).length
                }
              </div>
              <p className="text-xs text-gray-600">Temporarily paused</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Projects Overview</CardTitle>
                <CardDescription>
                  {filteredProjects.length} of {assignedProjects.length}{" "}
                  projects
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-4 text-lg font-semibold">
                  No projects found
                </h3>
                <p className="mt-2 text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Projects assigned by Super Admin will appear here."}
                </p>
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project & Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <ProjectTableRow key={project.id} project={project} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Report Section */}
        {report && (
          <Card>
            <CardHeader>
              <CardTitle>Project Overview Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <div className="text-2xl font-bold">
                    {report.totalProjects}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <div className="text-2xl font-bold">
                    {(report.completionRate * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Average Duration</p>
                  <div className="text-2xl font-bold">
                    {report.averageDuration} days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Details Modal */}
        <Dialog
          open={isProjectDetailsOpen}
          onOpenChange={setIsProjectDetailsOpen}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Project Details
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProjectDetailsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                Complete information about the selected project.
              </DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6 py-4">
                {/* Project Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedProject.name}
                    </h3>
                    <p className="text-gray-600">{selectedProject.client}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${
                        selectedProject.statusColor
                      } text-white border-0 flex items-center gap-1`}
                    >
                      {getStatusIcon(selectedProject.status)}
                      {selectedProject.status}
                    </Badge>
                    <Badge
                      className={`${getPriorityColor(
                        selectedProject.priority,
                      )} text-white border-0`}
                    >
                      {selectedProject.priority}
                    </Badge>
                  </div>
                </div>

                {/* Project Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Location
                      </Label>
                      <p className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {selectedProject.location}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Timeline
                      </Label>
                      <p className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(
                          selectedProject.startDate,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(selectedProject.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Budget
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedProject.budget}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Team Size
                      </Label>
                      <p className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4" />
                        {selectedProject.teamSize} members
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Tasks Progress
                      </Label>
                      <p className="mt-1">
                        {selectedProject.completedTasks}/
                        {selectedProject.tasksCount} completed
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Last Updated
                      </Label>
                      <p className="mt-1">
                        {new Date(
                          selectedProject.lastUpdated,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">
                    Project Progress
                  </Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-medium">
                        {selectedProject.progress}%
                      </span>
                    </div>
                    <Progress
                      value={selectedProject.progress}
                      className="h-3"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">
                    Description
                  </Label>
                  <p className="text-sm leading-relaxed p-4 bg-gray-50 rounded-lg">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() =>
                      alert(
                        "Task management will be implemented in the next phase",
                      )
                    }
                    className="flex-1"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    View Tasks
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      alert(
                        "Timeline view will be implemented in the next phase",
                      )
                    }
                    className="flex-1"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Timeline
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      alert("Team view will be implemented in the next phase")
                    }
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Team
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Gantt Chart Modal */}
        <Dialog open={isGanttChartOpen} onOpenChange={setIsGanttChartOpen}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Project Timeline - Gantt Chart
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGanttChartOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                Visual timeline of all your projects and their progress.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-4 text-lg font-semibold">Gantt Chart View</h3>
                <p className="mt-2 text-gray-600">
                  Interactive Gantt chart will show:
                </p>
                <ul className="mt-4 text-sm text-gray-600 space-y-1">
                  <li>• Project timelines and dependencies</li>
                  <li>• Task scheduling and resource allocation</li>
                  <li>• Critical path analysis</li>
                  <li>• Progress tracking and milestones</li>
                </ul>
                <p className="mt-4 text-sm text-gray-600">
                  This feature will be implemented in the next phase.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MyProjectsPage;
