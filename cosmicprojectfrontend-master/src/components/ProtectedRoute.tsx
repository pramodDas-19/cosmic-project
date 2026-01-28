import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireAuth = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check user role
  if (allowedRoles.length > 0 && user) {
    // Normalize role for comparison
    const normalizeRole = (role: string): string => {
      if (role === "super-admin") return "superadmin";
      return role;
    };

    const normalizedUserRole = normalizeRole(user.role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // Redirect to appropriate dashboard based on user role
      const roleRoutes = {
        superadmin: "/superadmin",
        "super-admin": "/superadmin",
        manager: "/manager",
        technician: "/technician",
      };

      const redirectPath =
        roleRoutes[user.role as keyof typeof roleRoutes] || "/login";
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
