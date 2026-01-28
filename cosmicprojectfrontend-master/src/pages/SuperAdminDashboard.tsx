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
import { Badge } from "@/components/ui/badge";
import {
  Users,
  User,
  Calendar,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  Search,
  Filter,
  FileText,
  MapPin,
  TrendingUp,
  Upload,
  Download,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';
import { useSocket } from "@/contexts/SocketContext";


const SuperAdminDashboard = () => {
  // State for stats and projects
  const [stats, setStats] = useState<any>({
    managersCount: 0,
    projectsCount: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [report, setReport] = useState(null);

  // Task details modal state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);

  const handleOpenTaskDetails = (task: any, project: any) => {
    setSelectedTask({ ...task, project });
    setIsTaskDetailsOpen(true);
  };

  const getProjectStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-300";
      case "in progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };



  // Project form state
  const [projectForm, setProjectForm] = useState({
    clientName: "",
    clientMobile:"",
    siteName: "",
    location: "",
    mapLink: "",
    priority: "",
    deadline: "",
    description: "",
    notes: "",
    assignedManager: "",
    files: [] as File[],
  });

  // User form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  // Add state and handler at the top of the component
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  const { socket } = useSocket();

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

  // Fetch stats, projects, and managers from backend
  useEffect(() => {
    fetchUserProfile();

    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Fetch user profile
    // fetch(`${API_BASE_URL}/profile`, { headers })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     if (data.status === "success") {
    //       setUserProfile(data.data);
    //     }
    //   })
    //   .catch(console.error);

    fetch(`${API_BASE_URL}/superadmin/stats`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setStats(data.data);
        }
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/superadmin/projects`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setProjects(Array.isArray(data.data.projects) ? data.data.projects : []);
        }
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/superadmin/managers`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setManagers(data.data);
        }
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/superadmin/technicians?status=Active`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setTechnicians(data.data);
        }
      })
      .catch(console.error);

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
      toast.success(`New project "${data.project.siteName}" created and assigned.`);
    });
    // Task assigned
    socket.on("task_assigned", (data) => {
      toast.success(`Task "${data.task.title}" assigned to technician.`);
    });
    // Task status updated
    socket.on("task_status_updated", (data) => {
      console.log("Received real-time update (superadmin):", data);
      toast(`Task "${data.task.title}" status updated to "${data.task.status}".`);
      // Optimistically update the project in state
      if (data.project) {
        setProjects((prevProjects) => {
          const idx = prevProjects.findIndex((p) => p._id === data.project._id || p.id === data.project._id);
          if (idx !== -1) {
            const updated = [...prevProjects];
            updated[idx] = { ...updated[idx], ...data.project };
            return updated;
          }
          return prevProjects;
        });
      }
      // Re-fetch projects from backend
      const token = localStorage.getItem("token");
      fetch(`${API_BASE_URL}/superadmin/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            setProjects(Array.isArray(data.data.projects) ? data.data.projects : []);
          }
        })
        .catch(console.error);
      // Re-fetch stats from backend
      fetch(`${API_BASE_URL}/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            setStats(data.data);
          }
        })
        .catch(console.error);
    });
    // Report submitted
    socket.on("report_submitted", (data) => {
      toast.success(`Report submitted for task "${data.report.task}".`);
    });
    socket.on("project_status_updated", (data) => {
      setProjects((prev) => prev.map((p) => p._id === data.projectId ? { ...p, status: data.status } : p));
      toast.success(`Project status updated to ${data.status}`);
    });
    return () => {
      socket.off("project_created");
      socket.off("task_assigned");
      socket.off("task_status_updated");
      socket.off("report_submitted");
      socket.off("project_status_updated");
    };
  }, [socket]);

  // Filtered projects for search
  const filteredProjects = projects.filter((project) =>
    project.siteName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle task reassignment
  const handleOpenReassignModal = (task: any, project: any) => {
    setTaskToReassign({ ...task, project });
    setReassignTechnician("");
    setReassignReason("");
    setIsReassignOpen(true);
  };

  const handleReassignTask = async () => {
    if (!reassignTechnician || !reassignReason.trim()) {
      toast.error("Please select a technician and provide a reason");
      return;
    }

    if (!taskToReassign) {
      toast.error("No task selected");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const taskId = taskToReassign._id || taskToReassign.id;
      if (!taskId) {
        toast.error("Invalid task ID");
        return;
      }

      // Construct the URL correctly - MUST include /tasks/ in the path
      // API_BASE_URL format: https://cosmicproject-backend-1.onrender.com/api
      // Final URL should be: https://cosmicproject-backend-1.onrender.com/api/tasks/{taskId}/reassign

      let baseUrl = API_BASE_URL;
      // Remove trailing slash if present
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }

      // Explicitly construct the URL with /tasks/ segment
      const url = `${baseUrl}/tasks/${taskId}/reassign`;

      // CRITICAL VALIDATION: Ensure /tasks/ is in the URL
      if (!url.includes('/tasks/')) {
        const errorMsg = `URL construction error: Missing /tasks/ segment. API_BASE_URL: ${API_BASE_URL}, URL: ${url}`;
        console.error("❌", errorMsg);
        toast.error("Configuration error: Invalid API endpoint");
        return;
      }

      // Additional validation: Ensure URL has correct structure
      if (!url.match(/\/api\/tasks\/[a-f0-9]{24}\/reassign$/i)) {
        console.warn("⚠️ URL format warning:", url);
      }

      console.log("🟢 Calling reassign endpoint:", url);
      console.log("🟢 API_BASE_URL:", API_BASE_URL);
      console.log("🟢 Task ID:", taskId);
      console.log("🟢 Full request details:", {
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer [token]'
        },
        body: {
          technicianId: reassignTechnician,
          reason: reassignReason.trim()
        }
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          technicianId: reassignTechnician,
          reason: reassignReason.trim(),
        }),
      });

      console.log("🟡 Response status:", res.status, res.statusText);

      const data = await res.json();
      console.log("🟡 Response data:", data);

      if (res.ok && data.status === "success") {
        toast.success("Task reassigned successfully");
        setIsReassignOpen(false);
        setTaskToReassign(null);
        setReassignTechnician("");
        setReassignReason("");

        // Refresh projects to get updated task assignments
        const refreshRes = await fetch(`${API_BASE_URL}/superadmin/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshData = await refreshRes.json();
        if (refreshData.status === "success") {
          setProjects(Array.isArray(refreshData.data.projects) ? refreshData.data.projects : []);
        }
      } else {
        toast.error(data.message || `Failed to reassign task (${res.status})`);
      }
    } catch (error) {
      console.error("🔴 Reassign error:", error);
      toast.error(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Handle project creation
  const handleCreateProject = async () => {
    if (
      !projectForm.clientName ||
      !projectForm.clientMobile||
      !projectForm.siteName ||
      !projectForm.location ||
      !projectForm.assignedManager
    ) {
      alert("Please fill in all required fields.");
      return;
    }


    const token = localStorage.getItem("token");
    let res, data;
    if (projectForm.files && projectForm.files.length > 0) {
      // Use FormData for file upload
      const formData = new FormData();
      Object.entries(projectForm).forEach(([key, value]) => {
        if (key === "files") {
          (value as File[]).forEach((file) => formData.append("files", file));
        } else {
          formData.append(key, value as string);
        }
      });
      res = await fetch(`${API_BASE_URL}/superadmin/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      // No files, send JSON
      res = await fetch(`${API_BASE_URL}/superadmin/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectForm),
      });
    }
    data = await res.json();
    if (res.ok && data.status === "success") {
      setProjects([...projects, data.data]);
      setProjectForm({
        clientName: "",
        clientMobile:"",
        siteName: "",
        location: "",
        mapLink: "",
        priority: "",
        deadline: "",
        description: "",
        notes: "",
        assignedManager: "",
        files: [],
      });
      setIsCreateProjectOpen(false);
      alert("✅ Project created successfully!");
    } else {
      alert(`Failed to create project: ${data.message || "Unknown error"}`);
    }
  };

  // File upload handler (just stores file objects in state)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setProjectForm({
      ...projectForm,
      files: [...projectForm.files, ...files],
    });
  };

  const removeFile = (index: number) => {
    setProjectForm({
      ...projectForm,
      files: projectForm.files.filter((_, i) => i !== index),
    });
  };

  // Stats cards config
  const statsCards = [
    {
      title: "Active Managers",
      value: stats.managersCount,
      description: "Currently managing projects",
      icon: Users,
      badge:
        stats.managersCount > 0
          ? {
            text: "Online",
            variant: "outline" as const,
            className: "bg-success text-success-foreground",
          }
          : undefined,
    },
    {
      title: "Total Projects",
      value: stats.projectsCount,
      description: "Across all locations",
      icon: ClipboardList,
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      description: "Successfully finished",
      icon: CheckCircle,
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      description: "In progress or assigned",
      icon: AlertTriangle,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
  };

  const [isTeamReportsOpen, setIsTeamReportsOpen] = useState(false);
  const [isTaskReportOpen, setIsTaskReportOpen] = useState(false);
  const [selectedReportTaskId, setSelectedReportTaskId] = useState<string | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignTechnician, setReassignTechnician] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [taskToReassign, setTaskToReassign] = useState<any | null>(null);


  // Add this function in the SuperAdminDashboard component
  const handleDownloadTaskReportPDF = async () => {
    if (!selectedReportTaskId) return;
    const token = localStorage.getItem("token");
    // Find the selected task object from all projects
    const selectedTask = projects.flatMap((project) => project.tasks || []).find((t) => (t._id || t.id) === selectedReportTaskId);
    if (!selectedTask) return;
    try {
      const response = await fetch(`${API_BASE_URL}/reports/task-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks: [selectedTask._id] }),
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedTask.title.replace(/\s+/g, '_')}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download task report: " + err.message);
    }
  };

  return (
    <DashboardLayout
      userRole="superadmin"
      userName={userProfile?.name || "System Administrator"}
      userEmail={userProfile?.email || "admin@cosmicsolutions.com"}
      userProfilePicture={userProfile?.profilePicture ? `${FILE_BASE_URL}/${userProfile.profilePicture}` : undefined}
      onProfilePictureUpload={handleProfilePictureUpload}
      onProfilePictureRemove={handleProfilePictureRemove}
    >
      <div className="mobile-container mobile-space-y max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="mobile-text-2xl font-bold text-foreground">
              System Overview
            </h1>
            <p className="text-muted-foreground mt-1 mobile-text-base">
              Manage your entire organization from this central dashboard.
            </p>
          </div>
          <div className="mobile-button-group">
            <Button
              onClick={() => setIsCreateProjectOpen(true)}
              className="mobile-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
        <div className="mobile-button-group">
          <Button variant="outline" onClick={() => setIsTaskReportOpen(true)} className="mobile-button">
            <FileText className="mr-2 h-4 w-4" /> Task Report
          </Button>

        </div>

        {/* Stats Cards */}
        <StatsCards stats={statsCards} />



        {/* Main Content */}
        <div className="mobile-grid-3">
          {/* Projects Section */}
          <div className="lg:col-span-2 ">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-col md:items-center sm:flex-col sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="mobile-text-lg">Project Management</CardTitle>
                    <CardDescription className="mobile-text-sm">
                      All projects across the organization
                    </CardDescription>
                  </div>
                  <div className="mobile-action-buttons">
                    <div className="mobile-search">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mobile-search-input pl-10"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className=" border rounded-xl p-5 hover:shadow-md transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                      {/* LEFT SECTION – PROJECT INFO */}
                      <div className="flex-1 space-y-3">
                        {/* Project Name */}
                        <h3 className="text-lg font-semibold">
                          {project.siteName}
                        </h3>

                        {/* Meta Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">

                          {/* Client */}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              <strong>Client:</strong> {project.clientName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span className="truncate">
                              <strong>Client Mobile No:</strong> {project.clientMobile|| "N/A"}
                            </span>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              <strong>Location:</strong> {project.location}
                            </span>
                          </div>
                          

                          {/* Deadline */}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <strong>Due:</strong>{" "}
                              {project.deadline
                                ? new Date(project.deadline).toLocaleDateString()
                                : "No deadline"}
                            </span>
                          </div>

                          {/* Priority */}
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                              <strong>Priority:</strong>{" "}
                              <Badge
                                variant="outline"
                                className={
                                  project.priority === "urgent"
                                    ? "bg-red-100 text-red-800"
                                    : project.priority === "high"
                                      ? "bg-orange-100 text-orange-800"
                                      : project.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }
                              >
                                {project.priority?.toUpperCase() || "N/A"}
                              </Badge>
                            </span>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            <span>
                              <strong>Status:</strong>{" "}
                              <Badge
                                variant="outline"
                                className={`capitalize ${getProjectStatusBadgeClass(
                                  project.status
                                )}`}
                              >
                                {project.status}
                              </Badge>
                            </span>
                          </div>
                        </div>

                        {/* Project Files */}
                        {project.files && project.files.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Project Files:</p>
                            <ul className="list-disc list-inside text-sm text-blue-600">
                              {project.files.map((file: any, idx: number) => (
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

                      {/* RIGHT SECTION – ACTIONS */}
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </Card>
          </div>

          {/* All Tasks Card */}
          <div className="lg:col-span-2 mt-2">
            <Card>
              <CardHeader className="flex flex-col items-center justify-between">
                <CardTitle>All Tasks</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search tasks..."
                    className="w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12 rounded-lg">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <ClipboardList className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
                    <p className="text-gray-500">Create a new project and add tasks to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {projects.flatMap((project) =>
                      (project.tasks || []).map((task) => {
                        const isTaskOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Completed';
                        const status = isTaskOverdue ? 'Overdue' : task.status || 'Not Started';
                        const statusColor = isTaskOverdue ? 'bg-red-100 text-red-800' :
                          task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800';

                        return (
                          <div
                            key={task._id || task.id}
                            onClick={() => handleOpenTaskDetails(task, project)}
                            className="rounded-xl border  hover:shadow-md hover:border-blue-400 transition-all duration-200 overflow-hidden cursor-pointer"
                          >

                            <div className="p-5">
                              {/* Task Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-medium text-lg">
                                    {task.title?.charAt(0).toUpperCase() || 'T'}
                                  </div>
                                  <div className="ml-3">
                                    <h3 className="text-lg font-semibold">{task.title || 'Untitled Task'}</h3>
                                    <p className="text-sm">{project.siteName || 'No Project'}</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                  {status}
                                </span>
                              </div>

                              {/* Task Meta */}
                              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div className="flex items-center">
                                  <User className="w-4 h-4 text-gray-400 mr-2" />
                                  <div>
                                    <p >Technician</p>
                                    <p className="font-medium ">
                                      {task.assignedTo?.name || 'Unassigned'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className={`w-4 h-4 mr-2 ${isTaskOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                                  <div>
                                    <p className="text-gray-500">
                                      {isTaskOverdue ? 'Overdue' : 'Due Date'}
                                    </p>
                                    <p className={`font-medium ${isTaskOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                      {task.deadline
                                        ? new Date(task.deadline).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })
                                        : 'No deadline'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Status Timeline */}
                              {task.statusLog && task.statusLog.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <p className="text-sm font-medium text-gray-500 mb-2">Status History</p>
                                  <ul className="space-y-2">
                                    {task.statusLog.slice(0, 2).map((log, idx) => (
                                      <li key={idx} className="flex items-start">
                                        <div className="flex-shrink-0 h-2 w-2 mt-1.5 rounded-full bg-gray-300 mr-2"></div>
                                        <div className="text-sm">
                                          <span className="font-medium">{log.status}</span>
                                          {log.timestamp && (
                                            <span className="text-gray-500 text-xs ml-2">
                                              {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                          )}
                                          {log.comment && (
                                            <p className="text-gray-500 text-xs mt-0.5">{log.comment}</p>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                    {task.statusLog.length > 2 && (
                                      <li className="text-xs text-gray-500">
                                        +{task.statusLog.length - 2} more updates
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              {/* Reassign Task Button */}
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenReassignModal(task, project);
                                  }}
                                  className="w-full"
                                >
                                  Reassign Task
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-12 w-full"
                    onClick={() => setIsCreateProjectOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Project Dialog */}
        <Dialog
          open={isCreateProjectOpen}
          onOpenChange={setIsCreateProjectOpen}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a comprehensive project with all necessary details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input
                    id="client-name"
                    placeholder="Enter client company name"
                    value={projectForm.clientName}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        clientName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name *</Label>
                  <Input
                    id="site-name"
                    placeholder="Enter project/site name"
                    value={projectForm.siteName}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        siteName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              {/* Client mobile no */}
               <div className="space-y-2">
                <Label htmlFor="mob-No">Client Mobile No *</Label>
                <Input
                  id="mob-No"
                  placeholder="Enter Client Mobile Number"
                  value={projectForm.clientMobile}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, 
                      clientMobile: e.target.value })
                  }
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location (Address) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Enter complete address"
                    value={projectForm.location}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        location: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!projectForm.location}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-link">Map Link (Optional)</Label>
                <Input
                  id="map-link"
                  placeholder="Paste Google Maps link or coordinates"
                  value={projectForm.mapLink}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, mapLink: e.target.value })
                  }
                />
              </div>

              {/* Assign Manager */}
              <div className="space-y-2">
                <Label htmlFor="assigned-manager">Assign Manager *</Label>
                <Select
                  value={projectForm.assignedManager}
                  onValueChange={(value) =>
                    setProjectForm({ ...projectForm, assignedManager: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager to assign this project" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager: any) => (
                      <SelectItem key={manager._id || manager.id} value={manager._id || manager.id}>
                        {manager.name} - {manager.department || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={projectForm.priority}
                    onValueChange={(value) =>
                      setProjectForm({ ...projectForm, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority level" />
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
                    value={projectForm.deadline}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        deadline: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Task Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the project requirements and scope"
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes, special instructions, or requirements"
                  value={projectForm.notes}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Project Files</Label>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("project-files")?.click()
                    }
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files (Plans, Specifications, etc.)
                  </Button>
                  <input
                    id="project-files"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dwg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {projectForm.files.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Uploaded Files:</Label>
                      {projectForm.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded-md"
                        >
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >

                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setIsCreateProjectOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                className="w-full sm:w-auto"
              >
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add the project details modal at the bottom of the return */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Project Details</DialogTitle>
              <DialogDescription>Detailed information about the selected project.</DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Site Name:</span> {selectedProject.siteName}
                </div>
                <div>
                  <span className="font-semibold">Client Name:</span> {selectedProject.clientName}
                </div>
                 <div>
                  <span className="font-semibold">Client Mobile No:</span> {selectedProject.clientMobile || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Location:</span> {selectedProject.location}
                </div>
                <div>
                  <span className="font-semibold">Manager:</span> {selectedProject.assignedManagerName || "Unassigned"}
                </div>
                <div>
                  <span className="font-semibold">Priority:</span> {selectedProject.priority}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> {selectedProject.status}
                </div>
                <div>
                  <span className="font-semibold">Deadline:</span> {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : "No deadline"}
                </div>
                <div>
                  <span className="font-semibold">Description:</span> {selectedProject.description}
                </div>
                <div>
                  <span className="font-semibold">Notes:</span> {selectedProject.notes}
                </div>
                <div>
                  <span className="font-semibold">Created At:</span> {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : ""}
                </div>
                <div>
                  <span className="font-semibold">Last Updated:</span> {selectedProject.updatedAt ? new Date(selectedProject.updatedAt).toLocaleDateString() : ""}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report Section */}
        {report && (
          <div className="mt-8 p-4 bg-muted rounded-md">
            <h2 className="text-lg font-semibold">Project Report Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Total Projects:</strong> {report.totalProjects}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Completion Rate:</strong>{" "}
                  {(report.completionRate * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Average Duration:</strong> {report.averageDuration}{" "}
                  days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Report Dialog */}
        <Dialog open={isTaskReportOpen} onOpenChange={setIsTaskReportOpen}>
          <DialogContent className="mobile-dialog-content max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mobile-text-lg">Task Report</DialogTitle>
              <DialogDescription className="mobile-text-sm">
                View all tasks updated by technicians, including attachments and descriptions. You can also download this report as a PDF.
              </DialogDescription>
            </DialogHeader>

            <div className="mobile-space-y">
              {projects.length === 0 ? (
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
                      <table className="w-full border-collapse">
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
                          {projects.flatMap((project) =>
                            (project.tasks || []).map((task) => (
                              <tr key={task._id || task.id} className="hover:bg-gray-700">
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-4">
                    {projects.flatMap((project) =>
                      (project.tasks || []).map((task) => (
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
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mobile-button-group mt-6">
              <Button
                variant="outline"
                onClick={() => setIsTaskReportOpen(false)}
                className="mobile-button"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadTaskReportPDF}
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
      {/* Task Details Modal */}
      <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTask?.project?.siteName || "Project Details"}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Technician</p>
                  <p className="font-medium">
                    {selectedTask.assignedTo?.name || "Unassigned"}
                  </p>
                </div>



                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium">
                    {selectedTask.deadline
                      ? new Date(selectedTask.deadline).toLocaleDateString()
                      : "No deadline"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className="capitalize">
                    {selectedTask.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Project</p>
                  <p className="font-medium">
                    {selectedTask.project?.siteName}
                  </p>
                </div>
              </div>

              {selectedTask.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">
                  Status Timeline
                </p>

                {selectedTask.statusLog?.length > 0 ? (
                  <div className="relative pl-4 border-l border-gray-300 space-y-4">
                    {selectedTask.statusLog.map((log: any, index: number) => (
                      <div key={index} className="relative">
                        <span
                          className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ${log.status === "Completed"
                              ? "bg-green-500"
                              : log.status === "Delayed"
                                ? "bg-orange-500"
                                : "bg-blue-500"
                            }`}
                        />
                        <p className="text-sm font-medium capitalize">
                          {log.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString()
                            : ""}
                        </p>
                        {log.comment && (
                          <p className="text-xs text-gray-600 mt-1">
                            {log.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No status history available
                  </p>
                )}
              </div>

              {/* Reassign Task Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleOpenReassignModal(selectedTask, selectedTask.project);
                    setIsTaskDetailsOpen(false);
                  }}
                  className="w-full"
                >
                  Reassign Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reassign Task Modal */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <DialogDescription>
              Reassign this task to a different active technician
            </DialogDescription>
          </DialogHeader>

          {taskToReassign && (
            <div className="space-y-4 py-4">
              {/* Current Technician (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="current-technician">Current Technician</Label>
                <Input
                  id="current-technician"
                  value={taskToReassign.assignedTo?.name || "Unassigned"}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              {/* New Technician Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="new-technician">
                  New Technician <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={reassignTechnician}
                  onValueChange={setReassignTechnician}
                >
                  <SelectTrigger id="new-technician">
                    <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians
                      .filter((tech) => tech.status === "Active")
                      .map((technician) => (
                        <SelectItem
                          key={technician._id || technician.id}
                          value={technician._id || technician.id}
                        >
                          {technician.name} {technician.email ? `(${technician.email})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason Textarea (Required) */}
              <div className="space-y-2">
                <Label htmlFor="reassign-reason">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reassign-reason"
                  placeholder="Enter the reason for reassigning this task..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500">
                  Please provide a clear reason for reassigning this task.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsReassignOpen(false);
                setTaskToReassign(null);
                setReassignTechnician("");
                setReassignReason("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignTask}
              disabled={!reassignTechnician || !reassignReason.trim()}
              className="w-full sm:w-auto"
            >
              Reassign Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>



    </DashboardLayout>
  );
};
export default SuperAdminDashboard;