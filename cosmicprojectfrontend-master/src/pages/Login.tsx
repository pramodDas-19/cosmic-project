import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/environment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Settings, Wrench } from "lucide-react";

type UserRole = "superadmin" | "manager" | "technician";

const Login = () => {
  const [role, setRole] = useState<UserRole>("superadmin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!email || !password || !role) {
      alert("Please fill in all fields including role selection");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      alert("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", { email, password, role });
      console.log("API URL:", `${API_BASE_URL}/auth/login`);
      
      // Make direct API call first to get user data
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/auth/login`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Check if response is ok before trying to read JSON
      if (!response.ok) {
        // Try to read error message from response if possible
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || "Invalid credentials";
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        alert(`❌ Login failed!\n\n${errorMessage}`);
        return;
      }

      const data = await response.json();

      if (data.status === "success") {
        // Store token and user info
        localStorage.setItem("token", data.data.token);
        sessionStorage.setItem("currentUser", JSON.stringify(data.data.user));

        // Navigate to appropriate dashboard based on user's actual role
        const routes = {
          superadmin: "/superadmin",
          "super-admin": "/superadmin", // Handle server format
          manager: "/manager",
          technician: "/technician",
        };

        const userRole = data.data.user.role;
        console.log(
          "Login successful, user role:",
          userRole,
          "navigating to:",
          routes[userRole],
        );

        alert(`✅ Login successful!\n\nWelcome, ${data.data.user.name}!`);

        // Force immediate navigation without timeout
        window.location.href = routes[userRole] || "/login";
      } else {
        alert(`❌ Login failed!\n\n${data.message || "Invalid credentials"}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "Connection error! Please make sure the backend server is running.";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out! The server is taking too long to respond.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error! Please check your internet connection.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(`❌ Login failed!\n\n${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig = {
    superadmin: {
      icon: Shield,
      title: "Super Admin",
      description: "Full system control and oversight",
      color: "bg-primary text-primary-foreground",
    },
    manager: {
      icon: Settings,
      title: "Manager",
      description: "Task assignment and team management",
      color: "bg-success text-success-foreground",
    },
    technician: {
      icon: Wrench,
      title: "Technician",
      description: "Field operations and task execution",
      color: "bg-pending text-pending-foreground",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mobile-padding">
      <div className="w-full max-w-md mobile-space-y">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fdf520b57241b409c97fe8b1702f73e79%2Fce826268d92b499a98eeb82a92fb89e5?format=webp&width=800"
              alt="Cosmic Solutions"
              className="h-12 sm:h-16 w-auto bg-white rounded-sm"
            />
          </div>
          <p className="mobile-text-sm text-muted-foreground mt-2">
            Site Engineer & CCTV Management System
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="mobile-space-y">
            <div className="text-center">
              <CardTitle className="mobile-text-2xl">Welcome Back</CardTitle>
              <CardDescription className="mobile-text-base">Sign in to your account</CardDescription>
            </div>

            {/* Role Selection */}
            <div className="mobile-form-group">
              <Label className="mobile-text-sm">Select your role</Label>
              <Select
                value={role}
                onValueChange={(value: UserRole) => setRole(value)}
              >
                <SelectTrigger className="mobile-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span className="mobile-text-sm">{config.title}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Role Badge */}
              <div className="flex justify-center pt-2">
                <Badge
                  variant="outline"
                  className={`${roleConfig[role].color} border-0 mobile-text-sm`}
                >
                  {React.createElement(roleConfig[role].icon, {
                    className: "h-3 w-3 mr-1",
                  })}
                  {roleConfig[role].description}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="mobile-form">
              <div className="mobile-form-group">
                <Label htmlFor="email" className="mobile-text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="mobile-input"
                />
              </div>

              <div className="mobile-form-group">
                <Label htmlFor="password" className="mobile-text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="mobile-input"
                />
              </div>

              <Button
                type="submit"
                className="mobile-button h-11 mobile-text-base font-medium"
                disabled={isLoading}
              >
                {isLoading
                  ? "Signing in..."
                  : `Sign In as ${roleConfig[role].title}`}
              </Button>
            </form>

            {/* Available Credentials */}
            <div className="mt-6 mobile-padding bg-muted rounded-lg">
              <p className="mobile-text-sm font-medium text-muted-foreground mb-3">
                Available Login Credentials:
              </p>

              <div className="mobile-space-y">
                <div>
                  <p className="mobile-text-sm font-medium text-primary">
                    Super Admin:
                  </p>
                  <p className="mobile-text-sm text-muted-foreground">
                    admin@cosmicsolutions.com / Admin@123
                  </p>
                </div>

                <div>
                  <p className="mobile-text-sm font-medium text-success">Managers:</p>
                  <p className="mobile-text-sm text-muted-foreground">
                    manager@cosmicsolutions.com / Manager@123
                  </p>
                  <p className="mobile-text-sm text-muted-foreground">
                    sarah.johnson@cosmicsolutions.com / Sarah@123
                  </p>
                  <p className="mobile-text-sm text-muted-foreground">
                    david.kim@cosmicsolutions.com / David@123
                  </p>
                </div>

                <div>
                  <p className="mobile-text-sm font-medium text-pending">
                    Technicians:
                  </p>
                  <p className="mobile-text-sm text-muted-foreground">
                    technician@cosmicsolutions.com / Tech@123
                  </p>
                  <p className="mobile-text-sm text-muted-foreground">
                    mike.chen@cosmicsolutions.com / Mike@123
                  </p>
                  <p className="mobile-text-sm text-muted-foreground">
                    lisa.rodriguez@cosmicsolutions.com / Lisa@123
                  </p>
                  <p className="mobile-text-sm text-muted-foreground">
                    james.wilson@cosmicsolutions.com / James@123
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center mobile-text-sm text-muted-foreground">
          © 2025 Cosmic Solutions. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
