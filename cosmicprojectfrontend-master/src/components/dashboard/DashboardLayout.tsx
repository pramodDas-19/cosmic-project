import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL, FILE_BASE_URL } from "@/config/environment";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ProfilePictureUpload from "@/components/ui/ProfilePictureUpload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/ui/notifications";
import {
  Building2,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  Shield,
  Wrench,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { ModeToggle } from "../mode-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: "superadmin" | "super-admin" | "manager" | "technician";
  userName?: string;
  userEmail?: string;
  userProfilePicture?: string;
  onProfilePictureUpload?: (file: File) => Promise<void>;
  onProfilePictureRemove?: () => Promise<void>;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole,
  userName = "User",
  userEmail = "user@cosmicsolutions.com",
  userProfilePicture,
  onProfilePictureUpload,
  onProfilePictureRemove,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [profilePicture, setProfilePicture] = React.useState(userProfilePicture);
  const [imageLoadError, setImageLoadError] = React.useState(false);
  const [currentBlobUrl, setCurrentBlobUrl] = React.useState<string | null>(null);

  // Cleanup blob URLs when component unmounts or when profile picture changes
  React.useEffect(() => {
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [currentBlobUrl]);

  // Utility function to construct profile picture URL
  const constructProfilePictureUrl = (filename: string): string => {
    if (!filename) return '';
    
    console.log("Constructing URL for filename:", filename);
    
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) {
      console.log("Using full URL:", filename);
      return filename;
    }
    
    // If the filename already includes 'uploads/', use it as is
    if (filename.includes('uploads/')) {
      // Try multiple approaches to handle CORS
      const possibleUrls = [
        `${FILE_BASE_URL}/${filename}`,
        `${API_BASE_URL}/profile/picture/${filename.split('/').pop()}`, // Try API endpoint
        `${FILE_BASE_URL}/static/${filename}`,
        `${FILE_BASE_URL}/public/${filename}`
      ];
      
      const selectedUrl = possibleUrls[0];
      console.log("Using path with uploads:", selectedUrl);
      console.log("Alternative URLs available:", possibleUrls);
      return selectedUrl;
    }
    
    // Try different possible endpoints for just filenames
    const possibleEndpoints = [
      `${FILE_BASE_URL}/uploads/${filename}`,
      `${API_BASE_URL}/profile/picture/${filename}`,
      `${FILE_BASE_URL}/static/uploads/${filename}`,
      `${FILE_BASE_URL}/images/${filename}`,
      `${FILE_BASE_URL}/public/uploads/${filename}`,
      `${FILE_BASE_URL}/files/${filename}`
    ];
    
    const selectedUrl = possibleEndpoints[0];
    console.log("Selected URL:", selectedUrl);
    return selectedUrl;
  };

  // Function to fetch image as blob and convert to data URL to avoid CORS
  const fetchImageAsDataUrl = async (url: string): Promise<string> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Cleanup previous blob URL
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
      
      setCurrentBlobUrl(blobUrl);
      return blobUrl;
    } catch (error) {
      console.error("Error fetching image as blob:", error);
      return '';
    }
  };

  // Test if an image URL is accessible
  const testImageUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`Image URL test failed for ${url}:`, error);
      return false;
    }
  };

  // Handle image load error
  const handleImageError = () => {
    console.warn("Profile picture failed to load, clearing it");
    setProfilePicture(undefined);
    setImageLoadError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    console.log("Profile picture loaded successfully");
    setImageLoadError(false);
  };

  // Function to fetch profile picture as blob to avoid CORS
  const fetchProfilePictureAsBlob = async (filename: string): Promise<string | null> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      // Try to fetch through API endpoint first
      const apiUrl = `${API_BASE_URL}/profile/picture/${filename.split('/').pop()}`;
      console.log("Trying to fetch through API:", apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.log("API endpoint failed, trying direct URL");
        // Fallback to direct URL
        const directUrl = `${FILE_BASE_URL}/${filename}`;
        const directResponse = await fetch(directUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!directResponse.ok) {
          throw new Error(`Failed to fetch image: ${directResponse.status}`);
        }
        
        const blob = await directResponse.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Cleanup previous blob URL
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
        }
        setCurrentBlobUrl(blobUrl);
        return blobUrl;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Cleanup previous blob URL
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
      setCurrentBlobUrl(blobUrl);
      return blobUrl;
    } catch (error) {
      console.error("Error fetching profile picture as blob:", error);
      return null;
    }
  };

  // Fetch user profile on component mount to get the latest profile picture
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("Profile fetch response:", data);
        if (data.status === "success" && data.data.profilePicture) {
          console.log("Profile fetch - backend returned profilePicture:", data.data.profilePicture);
          
          // Try to fetch as blob to avoid CORS issues
          const blobUrl = await fetchProfilePictureAsBlob(data.data.profilePicture);
          if (blobUrl) {
            console.log("Successfully fetched profile picture as blob");
            setProfilePicture(blobUrl);
          } else {
            console.log("Blob fetch failed, using direct URL");
            const profilePictureUrl = constructProfilePictureUrl(data.data.profilePicture);
            setProfilePicture(profilePictureUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // Function to refresh profile picture
  const refreshProfilePicture = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("Refresh profile response:", data);
      
      if (data.status === "success" && data.data.profilePicture) {
        console.log("Refresh - backend returned profilePicture:", data.data.profilePicture);
        
        // Try to fetch as blob to avoid CORS issues
        const blobUrl = await fetchProfilePictureAsBlob(data.data.profilePicture);
        if (blobUrl) {
          console.log("Successfully refreshed image as blob");
          setProfilePicture(blobUrl);
        } else {
          console.log("Blob fetch failed for refresh, using direct URL");
          const profilePictureUrl = constructProfilePictureUrl(data.data.profilePicture);
          setProfilePicture(profilePictureUrl);
        }
      } else {
        // No profile picture, clear it
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
          setCurrentBlobUrl(null);
        }
        setProfilePicture(undefined);
      }
    } catch (error) {
      console.error("Error refreshing profile picture:", error);
    }
  };

  // Use onProfilePictureUpload if provided, otherwise fallback to local upload logic
  const handleProfilePictureUpload = onProfilePictureUpload || (async (file: File) => {
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
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      if (data.status === "success") {
        console.log("Upload response data:", data);
        console.log("Backend returned profilePicture:", data.data.profilePicture);
        
        // Create a preview URL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setProfilePicture(previewUrl);
        
        // Cleanup previous blob URL
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
        }
        setCurrentBlobUrl(previewUrl);
        
        toast.success("Profile picture uploaded successfully!");
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload profile picture");
      throw error;
    }
  });

  // Handle profile picture removal
  const handleProfilePictureRemove = onProfilePictureRemove || (async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/profile/picture`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Remove failed with status ${response.status}`);
      }

      if (data.status === "success") {
        // Cleanup blob URL
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
          setCurrentBlobUrl(null);
        }
        
        setProfilePicture(undefined);
        setImageLoadError(false);
        toast.success("Profile picture removed successfully!");
      } else {
        throw new Error(data.message || "Remove failed");
      }
    } catch (error) {
      console.error("Profile picture removal error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove profile picture");
      throw error;
    }
  });

  // Normalize role to handle both server formats
  const normalizeRole = (role: string): keyof typeof roleConfig => {
    if (role === "super-admin") return "superadmin";
    return role as keyof typeof roleConfig;
  };

  const roleConfig = {
    superadmin: {
      title: "Super Admin",
      icon: Shield,
      color: "bg-primary text-primary-foreground",
      navigation: [
        { title: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
        {
          title: "Projects",
          href: "/superadmin/projects",
          icon: ClipboardList,
        },
        { title: "Reports", href: "/superadmin/reports", icon: FileText },
        { title: "Settings", href: "/superadmin/settings", icon: Settings },
      ],
    },
    manager: {
      title: "Manager",
      icon: Building2,
      color: "bg-blue-600 text-white",
      navigation: [
        { title: "Dashboard", href: "/manager", icon: LayoutDashboard },
      
      ],
    },
    technician: {
      title: "Technician",
      icon: Wrench,
      color: "bg-green-600 text-white",
      navigation: [
        { title: "Dashboard", href: "/technician", icon: LayoutDashboard },
      ],
    },
  };

  const config = roleConfig[normalizeRole(userRole)];
  const RoleIcon = config.icon;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between mobile-padding border-b border-sidebar-border">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fdf520b57241b409c97fe8b1702f73e79%2Fce826268d92b499a98eeb82a92fb89e5?format=webp&width=800"
              alt="Cosmic Solutions"
              className="h-8 sm:h-10 w-auto max-w-full"
            />
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="mobile-padding border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <ProfilePictureUpload
                currentImage={profilePicture}
                userName={userName}
                onImageUpload={handleProfilePictureUpload}
                onImageRemove={handleProfilePictureRemove}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="mobile-text-sm font-medium text-sidebar-foreground truncate">
                  {userName}
                </p>
                <Badge
                  variant="outline"
                  className={`${config.color} border-0 mobile-text-sm`}
                >
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {config.title}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mobile-padding mobile-space-y">
            {config.navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start mobile-text-sm text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent",
                    isActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false); // Close mobile sidebar
                  }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.title}
                </Button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="mobile-padding border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start mobile-text-sm text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="mobile-header">
          <div className="flex items-center mobile-space-x">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="mobile-header-title">
              {config.navigation.find((item) => item.href === location.pathname)
                ?.title || "Dashboard"}
            </h1>
          </div>

          {/* Header Actions */}
          <div className="flex items-center mobile-space-x">
            <NotificationBell />
            <ModeToggle/>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePicture} alt={userName} onError={handleImageError} onLoad={handleImageLoad} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
