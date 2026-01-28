import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { API_BASE_URL, FILE_BASE_URL } from "@/config/environment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList, Search, Plus, Eye, Edit, MapPin, Calendar, Upload,
  Trash2
} from "lucide-react";
import { getProjectStatusClasses, getPriorityClasses } from "@/utils/statusStyles";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from 'react-hot-toast';

const SuperAdminProjects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [projectForm, setProjectForm] = useState({
    clientName: "", clientMobile: "", siteName: "", location: "", mapLink: "",
    priority: "", deadline: "", description: "", notes: "",
    assignedManager: "", files: [] as File[],
  });

  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      try {
        // Fetch user profile
        const profileResponse = await axios.get(`${API_BASE_URL}/profile`, { headers });
        if (profileResponse.data.status === "success") {
          setUserProfile(profileResponse.data.data);
        }

        // Fetch projects
        const projectsResponse = await axios.get(`${API_BASE_URL}/superadmin/projects`, { headers });
        if (projectsResponse.data.status === "success") {
          const data = projectsResponse.data.data;
          setProjects(Array.isArray(data.projects) ? data.projects : []);
        } else {
          setProjects([]);
        }
        // Fetch managers
        const managersResponse = await axios.get(`${API_BASE_URL}/superadmin/managers`, { headers });
        if (managersResponse.data.status === "success") {
          const managersData = managersResponse.data.data.map((manager: any) => ({
            id: manager._id,
            name: manager.name,
            email: manager.email,
            department: manager.department || 'General'
          }));
          setManagers(managersData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProject = async () => {
    if (!projectForm.clientName || !projectForm.clientMobile || !projectForm.siteName || !projectForm.location || !projectForm.assignedManager) {
      alert("Please fill all required fields.");
      return;
    }
    const selectedManager = managers.find(m => m.id === projectForm.assignedManager);
    const formData = new FormData();
    formData.append('clientName', projectForm.clientName);
    formData.append('clientMobile', projectForm.clientMobile);
    formData.append('siteName', projectForm.siteName);
    formData.append('location', projectForm.location);
    formData.append('mapLink', projectForm.mapLink);
    formData.append('priority', projectForm.priority || 'medium');
    formData.append('deadline', projectForm.deadline);
    formData.append('description', projectForm.description);
    formData.append('notes', projectForm.notes);
    formData.append('assignedManager', projectForm.assignedManager);
    formData.append('assignedManagerName', selectedManager?.name || "");
    projectForm.files.forEach((file) => {
      formData.append('files', file);
    });
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(`${API_BASE_URL}/superadmin/projects`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        const newProject = res.data.data;
        setProjects([newProject, ...projects]);
        setProjectForm({
          clientName: "", clientMobile: "", siteName: "", location: "", mapLink: "",
          priority: "", deadline: "", description: "", notes: "",
          assignedManager: "", files: [],
        });
        setIsCreateProjectOpen(false);

        // Manually trigger a notification
        if (socket) {
          socket.emit('project:created', {
            project: {
              _id: newProject._id,
              siteName: newProject.siteName,
              clientName: newProject.clientName,
              clientMobile: newProject.clientMobile,
              location: newProject.location,
              status: newProject.status || 'pending',
              priority: newProject.priority || 'medium',
              createdAt: new Date().toISOString()
            }
          });
        } else {
          // Fallback in case socket isn't connected
          toast.success(`Project "${newProject.siteName}" created successfully!`, {
            duration: 5000,
            icon: '🏗️',
          });
        }
      } else {
        alert(`Failed to create project: ${res.data.message || "Unknown error"}`);
      }
    } catch (error: any) {
      alert(`Failed to create project: ${error.response?.data?.message || error.message}`);
    }
  };


  const deleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/superadmin/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.status === "success") {
        setProjects(prev =>
          prev.filter(p => p._id !== projectId)
        );

        socket?.emit("project:deleted", { projectId });

        toast.success(
          `Project "${projectName}" deleted successfully 🗑️`,
          { duration: 4000 }
        );
      } else {
        toast.error(res.data.message || "Failed to delete project");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    toast.custom((t) => (
      <div className="fixed inset-20 z-50 flex items-center justify-center bg-black/40  ">
        <div className=" rounded-lg shadow-lg p-5 w-[320px] ">
          <p className="font-medium text-center mb-4 ">
            Are you sure you want to delete
            <span className="font-semibold text-red-600">
              {" "}{projectName}
            </span>
            ?
          </p>

          <div className="flex gap-3 justify-center">
            <button
              className="px-4 py-1.5 text-sm bg-gray-200 rounded text-black"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>

            <button
              className="px-4 py-1.5 text-sm bg-red-500 text-white rounded"
              onClick={async () => {
                toast.dismiss(t.id);
                await deleteProject(projectId, projectName);
              }}
            >Delete

            </button>
          </div>
        </div>
      </div>
    ), { duration: 3000 });
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProjectForm({ ...projectForm, files: [...projectForm.files, ...files] });
  };

  const handleOpenMap = () => {
    if (projectForm.location) {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(projectForm.location)}`;
      window.open(mapUrl, "_blank");
    }
  };

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  const filteredProjects = Array.isArray(projects) ? projects.filter((project) => {
    const matchesSearch =
      project.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      project.status?.toLowerCase().replace(" ", "_") === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    const getTime = (item: any) => {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      const deadline = item.deadline ? new Date(item.deadline).getTime() : 0;
      return created || deadline;
    };

    return getTime(b) - getTime(a);
  }) : [];

  const getPriorityColor = (priority: string) => {
    return getPriorityClasses(priority);
  };

  const getStatusColor = (status: string) => {
    return getProjectStatusClasses(status);
  };

  if (loading) {
    return (
      <DashboardLayout
        userRole="super-admin"
        userName={userProfile?.name || "System Administrator"}
        userEmail={userProfile?.email || "admin@cosmicsolutions.com"}
        userProfilePicture={userProfile?.profilePicture ? `${FILE_BASE_URL}/${userProfile.profilePicture}` : undefined}
      >
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="super-admin"
      userName={userProfile?.name || "System Administrator"}
      userEmail={userProfile?.email || "admin@cosmicsolutions.com"}
      userProfilePicture={userProfile?.profilePicture ? `${FILE_BASE_URL}/${userProfile.profilePicture}` : undefined}
    >
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">Monitor and manage all projects.</p>
          </div>
          <Button onClick={() => setIsCreateProjectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>

        <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Fill in the form to create a new project.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client Name *</Label>
                  <Input value={projectForm.clientName} onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })} />
                </div>

                <div>
                  <Label>Site Name *</Label>
                  <Input value={projectForm.siteName} onChange={(e) => setProjectForm({ ...projectForm, siteName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Client Mobile No *</Label>
                <Input
                  placeholder="Enter Client Mobile No"
                  value={projectForm.clientMobile}
                  onChange={(e) => setProjectForm({ ...projectForm, clientMobile: e.target.value })}
                />
              </div>
              <div>
                <Label>Location *</Label>
                <div className="flex gap-2">
                  <Input value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} className="flex-1" />
                  <Button type="button" variant="outline" onClick={handleOpenMap} disabled={!projectForm.location}>
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Map Link (Optional)</Label>
                <Input
                  placeholder="Paste Google Maps link or coordinates"
                  value={projectForm.mapLink}
                  onChange={(e) => setProjectForm({ ...projectForm, mapLink: e.target.value })}
                />
              </div>
              <div>
                <Label>Assign Manager *</Label>
                <Select value={projectForm.assignedManager} onValueChange={(value) => setProjectForm({ ...projectForm, assignedManager: value })}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    {managers.length === 0 ? (
                      <SelectItem value="" disabled>No managers available</SelectItem>
                    ) : (
                      managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} - {m.department}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={projectForm.priority} onValueChange={(value) => setProjectForm({ ...projectForm, priority: value })}>
                    <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={2} value={projectForm.notes} onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })} />
              </div>
              <div>
                <Label>Upload Files</Label>
                <Button type="button" variant="outline" onClick={() => document.getElementById("project-files")?.click()} className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
                <input id="project-files" type="file" multiple onChange={handleFileUpload} className="hidden" />
                {projectForm.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {projectForm.files.map((file, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProject}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Projects Overview</CardTitle>
            <CardDescription>Search, filter, and manage all active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects, clients, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
                <p className="mt-2 text-muted-foreground">No projects match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>ClientMobile</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead >Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.siteName}</div>
                            <div className="text-sm text-muted-foreground">
                              Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{project.clientName}</TableCell>
                        <TableCell>{project.clientMobile}</TableCell>
                        <TableCell>{project.location}</TableCell>
                        <TableCell>{project.assignedManagerName || "Unassigned"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(project.priority)}>
                            {project.priority?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(project.status)}>
                            {project.status || "Planning"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewProject(project)}>
                              <Eye className="h-3 w-3 mr-1" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project._id, project.siteName)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {/* Project Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-6">
            {/* Total Projects */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{projects.length}</p>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* In Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
                    {projects.filter((p) => p.status === "In Progress").length}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {projects.filter((p) => p.status === "In Progress").length}
                    </p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Completed */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-success rounded flex items-center justify-center text-success-foreground font-bold">
                    {projects.filter((p) => p.status === "Completed").length}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {projects.filter((p) => p.status === "Completed").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Delayed */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-destructive rounded flex items-center justify-center text-destructive-foreground font-bold">
                    {projects.filter((p) => p.status === "Delayed").length}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {projects.filter((p) => p.status === "Delayed").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Delayed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>
      </div>
      {/* View Project Modal */}
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
                <span className="font-semibold">Client Mobile No:</span> {selectedProject.clientMobile}
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
              {/* Add more fields as needed */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SuperAdminProjects;