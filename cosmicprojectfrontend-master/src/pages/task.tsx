import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { API_BASE_URL, FILE_BASE_URL } from "@/config/environment";
import { Search, Plus, Eye, Calendar, AlertCircle, Clock, Building, User, X, ChevronDown, ChevronUp, ChevronRight, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/contexts/SocketContext';
import { getTaskStatusClasses, getPriorityClasses } from "@/utils/statusStyles";

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState({ key: 'deadline', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [tasks, setTasks] = useState([]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTechnician: '',
    project: '',
    priority: 'Medium',
    deadline: ''
  });

  const technicians = [
    { name: "Field Technician", email: "technician@cosmicsolutions.com" },
    { name: "Mike Chen", email: "mike.chen@cosmicsolutions.com" },
    { name: "Lisa Rodriguez", email: "lisa.rodriguez@cosmicsolutions.com" },
    { name: "James Wilson", email: "james.wilson@cosmicsolutions.com" }
  ];

  const statusOptions = ['All', 'Assigned', 'In Progress', 'Completed'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Urgent'];

  const { socket } = useSocket();

  // Fetch tasks from backend
  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/manager/tasks`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (data.status === 'success') {
      // Map backend fields to frontend fields
      const mappedTasks = data.data.map(task => ({
        ...task,
        assignedTechnician: task.assignedTo?.name || '',
        technicianEmail: task.assignedTo?.email || '',
        project: task.project?.siteName || task.project || '',
        // Add other mappings as needed
      }));
      setTasks(mappedTasks);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Fetch user profile
    fetch(`${API_BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setUserProfile(data.data);
        }
      })
      .catch(console.error);

    fetchTasks();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleTaskStatusUpdated = () => {
      fetchTasks();
    };
    socket.on('task_status_updated', handleTaskStatusUpdated);
    return () => {
      socket.off('task_status_updated', handleTaskStatusUpdated);
    };
  }, [socket]);

  const filteredTasks = useMemo(() => {
    const normalizedStatusFilter = statusFilter === 'All'
      ? 'all'
      : statusFilter.toLowerCase().replace(' ', '_');

    const normalizedPriorityFilter =
      priorityFilter === 'All' ? 'all' : priorityFilter.toLowerCase();

    return tasks
      .filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.assignedTechnician && task.assignedTechnician.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (task.project && task.project.toLowerCase().includes(searchTerm.toLowerCase()));

        const taskStatusKey = String(task.status || '')
          .toLowerCase()
          .replace(' ', '_');
        const taskPriorityKey = String(task.priority || '').toLowerCase();

        const matchesStatus =
          normalizedStatusFilter === 'all' ||
          taskStatusKey === normalizedStatusFilter;

        const matchesPriority =
          normalizedPriorityFilter === 'all' ||
          taskPriorityKey === normalizedPriorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const sortTasks = (tasks) => {
    const sortableTasks = [...tasks];
    if (sortConfig.key) {
      sortableTasks.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'assignedTechnician') {
          aValue = a.assignedTechnician?.toLowerCase() || '';
          bValue = b.assignedTechnician?.toLowerCase() || '';
        } else if (sortConfig.key === 'project') {
          aValue = a.project?.toLowerCase() || '';
          bValue = b.project?.toLowerCase() || '';
        } else if (sortConfig.key === 'deadline') {
          aValue = new Date(a.deadline).getTime();
          bValue = new Date(b.deadline).getTime();
        } else if (sortConfig.key === 'status') {
          const statusOrder = { 'Overdue': 0, 'In Progress': 1, 'Assigned': 2, 'Completed': 3 };
          aValue = statusOrder[a.status] || 4;
          bValue = statusOrder[b.status] || 4;
        } else if (sortConfig.key === 'priority') {
          const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
          aValue = priorityOrder[a.priority] || 4;
          bValue = priorityOrder[b.priority] || 4;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTasks;
  };

  const sortedAndFilteredTasks = useMemo(() => {
    return sortTasks(filteredTasks);
  }, [filteredTasks, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredTasks.length / itemsPerPage);
  const paginatedTasks = sortedAndFilteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const StatusBadge = ({ status }) => {
    const statusMap = {
      'Assigned': { bg: 'bg-blue-100 text-blue-800', text: 'Assigned' },
      'In Progress': { bg: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
      'Completed': { bg: 'bg-green-100 text-green-800', text: 'Completed' },
      'Overdue': { bg: 'bg-red-100 text-red-800', text: 'Overdue' }
    };

    const statusInfo = statusMap[status] || { bg: 'bg-gray-100 text-gray-800', text: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.bg.includes('bg-') ? '' : 'bg-gray-100 text-gray-800'}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    return getPriorityClasses(priority);
  };

  const getStatusColor = (status: string) => {
    return getTaskStatusClasses(status);
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return 'bg-red-100 text-red-800';
    }
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTask = () => {
    if (newTask.title && newTask.assignedTechnician && newTask.deadline) {
      const task = {
        id: tasks.length + 1,
        ...newTask,
        technicianEmail: technicians.find(t => t.name === newTask.assignedTechnician)?.email || '',
        status: 'Assigned',
        createdDate: new Date().toISOString().split('T')[0],
        attachments: []
      };
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        description: '',
        assignedTechnician: '',
        project: '',
        priority: 'Medium',
        deadline: ''
      });
      setShowCreateModal(false);
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const viewTask = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  return (
    <DashboardLayout
      userRole="manager"
      userName={userProfile?.name || "Project Manager"}
      userEmail={userProfile?.email || "manager@cosmicsolutions.com"}
      userProfilePicture={userProfile?.profilePicture ? `${FILE_BASE_URL}/${userProfile.profilePicture}` : undefined}
    >
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Page Description */}
        <div className="mb-8">
          <p className="text-gray-600 mt-1">Central hub to view, manage, and track all tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'In Progress').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'Completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => isOverdue(t.deadline)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks, projects, or technicians..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'All' ? 'All Status' : status}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                {priorityOptions.map(priority => (
                  <option key={priority} value={priority}>
                    {priority === 'All' ? 'All Priorities' : priority}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {paginatedTasks.length > 0 ? (
    paginatedTasks.map((task) => {
      const isTaskOverdue =
        isOverdue(task.deadline) && task.status !== "Completed";

      const status = isTaskOverdue ? "Overdue" : task.status || "Assigned";

      const statusColor = isTaskOverdue
        ? "bg-red-100 text-red-800"
        : task.status === "In Progress"
        ? "bg-yellow-100 text-yellow-800"
        : task.status === "Completed"
        ? "bg-green-100 text-green-800"
        : "bg-blue-100 text-blue-800";

      return (
        <div
          key={task.id}
          className="bg-white rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer"
          onClick={() => viewTask(task)}
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500">
                  {task.project || "No Project"}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${statusColor}`}>
                {status}
              </span>
            </div>

            {/* Meta */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>{task.assignedTechnician || "Unassigned"}</span>
              <span>
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      );
    })
  ) : (
    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
      <p className="text-gray-500">No tasks found</p>
    </div>
  )}
</div>

{/* Pagination */}
<div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200 mt-6 rounded-lg">
  <div className="text-sm text-gray-500">
    Showing{" "}
    <span className="font-medium">{paginatedTasks.length}</span> of{" "}
    <span className="font-medium">{sortedAndFilteredTasks.length}</span> tasks
  </div>

  <div className="flex space-x-2">
    <button
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
    >
      Previous
    </button>

    <button
      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
      className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4">Create New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.assignedTechnician}
                  onChange={(e) => setNewTask({...newTask, assignedTechnician: e.target.value})}
                >
                  <option value="">Select Technician</option>
                  {technicians.map(tech => (
                    <option key={tech.email} value={tech.name}>{tech.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.project}
                  onChange={(e) => setNewTask({...newTask, project: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateTask}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Task
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedTask.title}</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedTask.assignedTechnician}</div>
                      <div className="text-sm text-gray-500">{selectedTask.technicianEmail}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <p className="text-gray-900">{selectedTask.project}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <p className={`text-gray-900 ${isOverdue(selectedTask.deadline) ? 'text-red-600 font-medium' : ''}`}>
                    {new Date(selectedTask.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <p className="text-gray-900">{new Date(selectedTask.createdDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default TasksPage;