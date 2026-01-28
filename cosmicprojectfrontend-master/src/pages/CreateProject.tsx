import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

interface Manager {
  _id: string;
  name: string;
  email: string;
}

const CreateProject: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [assignedManager, setAssignedManager] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users?role=manager")
      .then(res => res.json())
      .then(data => setManagers(data))
      .catch(error => {
        console.error("Error fetching managers:", error);
        // Fallback data for development
        setManagers([
          { _id: "1", name: "John Manager", email: "john@cosmic.com" },
          { _id: "2", name: "Sarah Manager", email: "sarah@cosmic.com" },
          { _id: "3", name: "Mike Manager", email: "mike@cosmic.com" }
        ]);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Add your project creation logic here
    console.log("Creating project with manager:", assignedManager);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Handle success/error
    }, 1000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-1">Add a new project to your portfolio</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Fill in the project information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="projectTitle">Project Title *</Label>
                <Input
                  id="projectTitle"
                  placeholder="Enter project title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="Enter client name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  placeholder="Enter site name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Enter project location"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select required>
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
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="assignedManager">Assign Manager *</Label>
              <Select value={assignedManager} onValueChange={setAssignedManager} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.length === 0 ? (
                    <SelectItem value="" disabled>No managers available</SelectItem>
                  ) : (
                    managers.map(manager => (
                      <SelectItem key={manager._id} value={manager._id}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProject;