// API utility functions for backend communication
import { API_BASE_URL, FILE_BASE_URL } from '@/config/environment';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

// Create headers with auth token
const createHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: createHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return handleResponse(response);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (email: string, password: string, role?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: createHeaders(false),
      body: JSON.stringify({ email, password, ...(role && { role }) }),
    });

    return handleResponse(response);
  },

  // Register user
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: createHeaders(false),
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  // Logout user
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Get current user / profile
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("profilePicture", file);
    
    const response = await fetch(`${API_BASE_URL}/profile/picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse(response);
  },
  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "PUT",
      headers: createHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    return handleResponse(response);
  },
};

// User API calls
export const userAPI = {
  // Get all users
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    sortBy?: string;
    order?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
      method: "GET",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Get user by ID
  getUserById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "GET",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Create user
  createUser: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  // Update user
  updateUser: async (id: string, userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Get users by role
  getUsersByRole: async (role: string) => {
    const response = await fetch(`${API_BASE_URL}/users/role/${role}`, {
      method: "GET",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      method: "GET",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },
};

// Super Admin API functions
export const superAdminAPI = {
  getStats: () => apiRequest('/superadmin/stats'),
  
  getProjects: () => apiRequest('/superadmin/projects'),
  
  createProject: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/superadmin/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    return handleResponse(response);
  },

  updateProject: (id: string, data: any) =>
    apiRequest(`/superadmin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    apiRequest(`/superadmin/projects/${id}`, {
      method: 'DELETE',
    }),

  getManagers: () => apiRequest('/superadmin/managers'),
  
  getTechnicians: () => apiRequest('/superadmin/technicians'),
};

// Manager API functions
export const managerAPI = {
  getStats: () => apiRequest('/manager/stats'),
  
  getProjects: () => apiRequest('/manager/projects'),
  
  getTechnicians: () => apiRequest('/manager/technicians'),
  
  getTasks: () => apiRequest('/manager/tasks'),
  
  createTask: (taskData: any) =>
    apiRequest('/manager/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  
  updateTask: (id: string, data: any) =>
    apiRequest(`/manager/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Technician API functions
export const technicianAPI = {
  getTasks: () => apiRequest('/technician/tasks'),
  
  updateTaskStatus: (id: string, data: any) =>
    apiRequest(`/technician/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  getReports: () => apiRequest('/technician/reports'),
};
// Projects API functions
export const projectsAPI = {
  getProjects: (params?: any) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/projects?${searchParams}`);
  },

  getProject: (id: string) => apiRequest(`/projects/${id}`),

  updateProjectStatus: (id: string, status: string) =>
    apiRequest(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// Reports API functions
export const reportsAPI = {
  getOverview: (params?: any) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/reports/overview?${searchParams}`);
  },

  getProjectReport: (params?: any) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/reports/projects?${searchParams}`);
  },

  getPerformanceReport: () => apiRequest('/reports/performance'),
};

// Notification API calls
export const notificationAPI = {
  // Get user notifications
  getUserNotifications: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
    priority?: string;
    category?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/notifications?${queryParams}`,
      {
        method: "GET",
        headers: createHeaders(),
      },
    );

    return handleResponse(response);
  },

  // Create notification
  createNotification: async (notificationData: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
    category?: string;
    expiresAt?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(notificationData),
    });

    return handleResponse(response);
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "PUT",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PUT",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Delete notification
  deleteNotification: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Get notification statistics
  getNotificationStats: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/stats`, {
      method: "GET",
      headers: createHeaders(),
    });

    return handleResponse(response);
  },
};

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },

  // Clear authentication
  clearAuth: (): void => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
  },

  // Get current user from session
  getCurrentUserFromSession: () => {
    const userStr = sessionStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Store user in session
  setCurrentUserInSession: (user: any) => {
    sessionStorage.setItem("currentUser", JSON.stringify(user));
  },

  // Store auth token
  setAuthToken: (token: string) => {
    localStorage.setItem("token", token);
  },
};

// Default export with organized API modules
export default {
  auth: authAPI,
  user: userAPI,
  superAdmin: superAdminAPI,
  manager: managerAPI,
  technician: technicianAPI,
  projects: projectsAPI,
  reports: reportsAPI,
  notifications: notificationAPI,
  utils: apiUtils,
};