// Individual login credentials for the system
export interface UserCredential {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "super-admin" | "manager" | "technician";
  department?: string;
  active: boolean;
}

export const userCredentials: UserCredential[] = [
  // Super Admin
  {
    id: "admin-001",
    name: "System Administrator",
    email: "admin@cosmicsolutions.com",
    password: "Admin@123",
    role: "super-admin",
    department: "Administration",
    active: true,
  },

  // Managers
  {
    id: "mgr-001",
    name: "Project Manager",
    email: "manager@cosmicsolutions.com",
    password: "Manager@123",
    role: "manager",
    department: "Operations",
    active: true,
  },
  {
    id: "mgr-002",
    name: "Sarah Johnson",
    email: "sarah.johnson@cosmicsolutions.com",
    password: "Sarah@123",
    role: "manager",
    department: "Security Systems",
    active: true,
  },
  {
    id: "mgr-003",
    name: "David Kim",
    email: "david.kim@cosmicsolutions.com",
    password: "David@123",
    role: "manager",
    department: "Installation",
    active: true,
  },

  // Technicians
  {
    id: "tech-001",
    name: "Field Technician",
    email: "technician@cosmicsolutions.com",
    password: "Tech@123",
    role: "technician",
    department: "Field Operations",
    active: true,
  },
  {
    id: "tech-002",
    name: "Mike Chen",
    email: "mike.chen@cosmicsolutions.com",
    password: "Mike@123",
    role: "technician",
    department: "CCTV Installation",
    active: true,
  },
  {
    id: "tech-003",
    name: "Lisa Rodriguez",
    email: "lisa.rodriguez@cosmicsolutions.com",
    password: "Lisa@123",
    role: "technician",
    department: "Maintenance",
    active: true,
  },
  {
    id: "tech-004",
    name: "James Wilson",
    email: "james.wilson@cosmicsolutions.com",
    password: "James@123",
    role: "technician",
    department: "Network Setup",
    active: true,
  },
];

export const authenticateUser = (
  email: string,
  password: string,
  role: string,
): UserCredential | null => {
  const user = userCredentials.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      u.role === role &&
      u.active,
  );

  return user || null;
};

export const getUsersByRole = (
  role: "super-admin" | "manager" | "technician",
): UserCredential[] => {
  return userCredentials.filter((u) => u.role === role && u.active);
};

export const getUserById = (id: string): UserCredential | null => {
  return userCredentials.find((u) => u.id === id && u.active) || null;
};
