import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { API_BASE_URL } from "@/config/environment";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Settings,
  Shield,
} from "lucide-react";

const SuperAdminSettings = () => {
  // Backend-driven state
  const [managers, setManagers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userType, setUserType] = useState("");
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [lastCreatedUser, setLastCreatedUser] = useState<{ email: string; role: string; password: string } | null>(null);
  const [isShowCredentialsOpen, setIsShowCredentialsOpen] = useState(false);

  // Fetch managers and technicians from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      // Fetch managers
      const managersRes = await fetch(`${API_BASE_URL}/superadmin/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (managersRes.ok) {
        const data = await managersRes.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          setManagers(data.data);
        } else {
          setManagers([]);
        }
      } else {
        setManagers([]);
      }
      // Fetch technicians
      const techsRes = await fetch(`${API_BASE_URL}/superadmin/technicians`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (techsRes.ok) {
        const data = await techsRes.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          setTechnicians(data.data);
        } else {
          setTechnicians([]);
        }
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      setManagers([]);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role || !userForm.password) {
      alert("Please fill in all required fields");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userForm),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setIsAddUserOpen(false);
        setUserForm({ name: "", email: "", phone: "", department: "", role: "", password: "" });
        fetchUsers();
        setLastCreatedUser({ email: userForm.email, role: userForm.role, password: userForm.password });
        setIsShowCredentialsOpen(true);
        // alert("User added successfully!");
      } else {
        alert(`Failed to add user: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      alert("Failed to add user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, type: "manager" | "technician") => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        fetchUsers();
        alert("User deleted successfully!");
      } else {
        alert(`Failed to delete user: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      alert("Failed to delete user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="super-admin" userName="System Administrator" userEmail="admin@cosmicsolutions.com">
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-1">Manage users and system configurations.</p>
        </div>
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Managers Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Managers
                    </CardTitle>
                    <CardDescription>Manage project managers and their access</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setUserType("manager");
                      setUserForm({ ...userForm, role: "manager" });
                      setIsAddUserOpen(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Manager
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {managers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No managers yet</h3>
                    <p className="mt-2 text-muted-foreground">Add your first manager to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {managers.map((manager) => (
                          <TableRow key={manager._id}>
                            <TableCell className="font-medium">{manager.name}</TableCell>
                            <TableCell>{manager.email}</TableCell>
                            <TableCell>{manager.department || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-success text-success-foreground">
                                {manager.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setUserType("manager");
                                    setUserForm({
                                      name: manager.name,
                                      email: manager.email,
                                      phone: manager.phone || "",
                                      department: manager.department || "",
                                      role: "manager",
                                      password: ""
                                    });
                                    setIsAddUserOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(manager._id, "manager")}
                                >
                                  <Trash2 className="h-3 w-3" />
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
            </Card>
            {/* Technicians Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Technicians
                    </CardTitle>
                    <CardDescription>Manage field technicians and their access</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setUserType("technician");
                      setUserForm({ ...userForm, role: "technician" });
                      setIsAddUserOpen(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Technician
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {technicians.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No technicians yet</h3>
                    <p className="mt-2 text-muted-foreground">Add your first technician to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {technicians.map((technician) => (
                          <TableRow key={technician._id}>
                            <TableCell className="font-medium">{technician.name}</TableCell>
                            <TableCell>{technician.email}</TableCell>
                            <TableCell>{technician.department || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-success text-success-foreground">
                                {technician.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setUserType("technician");
                                    setUserForm({
                                      name: technician.name,
                                      email: technician.email,
                                      phone: technician.phone || "",
                                      department: technician.department || "",
                                      role: "technician",
                                      password: ""
                                    });
                                    setIsAddUserOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(technician._id, "technician")}
                                >
                                  <Trash2 className="h-3 w-3" />
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
            </Card>
          </TabsContent>
          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Configure access controls for different user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4" />
                        Super Admin Permissions
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Full system access and control</li>
                        <li>• Create, edit, and delete projects</li>
                        <li>• Manage all users (Managers & Technicians)</li>
                        <li>• Configure system settings</li>
                        <li>• Generate comprehensive reports</li>
                        <li>• Role and permission management</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4" />
                        Manager Permissions
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• View assigned projects only</li>
                        <li>• Create and assign tasks to technicians</li>
                        <li>• Monitor team performance</li>
                        <li>• Generate team reports</li>
                        <li>• Update task status and progress</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Settings className="h-4 w-4" />
                        Technician Permissions
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• View assigned tasks only</li>
                        <li>• Update task status and progress</li>
                        <li>• Upload completion proof and files</li>
                        <li>• Submit comments and delay reports</li>
                        <li>• Access task history and details</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Add User Dialog */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Add New {userType === "manager" ? "Manager" : "Technician"}
              </DialogTitle>
              <DialogDescription>
                Add a new {userType} to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name *</Label>
                <Input
                  id="user-name"
                  placeholder="Enter full name"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address *</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="Enter email address"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Password *</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Enter password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-department">Department</Label>
                <Input
                  id="user-department"
                  placeholder="Enter department"
                  value={userForm.department}
                  onChange={(e) =>
                    setUserForm({ ...userForm, department: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Phone</Label>
                <Input
                  id="user-phone"
                  placeholder="Enter phone number"
                  value={userForm.phone}
                  onChange={(e) =>
                    setUserForm({ ...userForm, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleAddUser} className="w-full sm:w-auto">
                Add {userType === "manager" ? "Manager" : "Technician"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Show Credentials Dialog */}
      <Dialog open={isShowCredentialsOpen} onOpenChange={setIsShowCredentialsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>User Credentials</DialogTitle>
            <DialogDescription>
              Please copy and share these credentials with the new user. They can log in immediately.
            </DialogDescription>
          </DialogHeader>
          {lastCreatedUser && (
            <div className="space-y-3">
              <div><span className="font-semibold">Email:</span> {lastCreatedUser.email}</div>
              <div><span className="font-semibold">Role:</span> {lastCreatedUser.role.charAt(0).toUpperCase() + lastCreatedUser.role.slice(1)}</div>
              <div><span className="font-semibold">Password:</span> {lastCreatedUser.password}</div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsShowCredentialsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SuperAdminSettings;