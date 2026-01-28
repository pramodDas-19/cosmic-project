import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface ProfilePictureUploadProps {
  currentImage?: string;
  userName: string;
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove?: () => Promise<void>;
  size?: "sm" | "md" | "lg";
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImage,
  userName,
  onImageUpload,
  onImageRemove,
  size = "md",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayImage, setDisplayImage] = useState<string | null>(currentImage || null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update display image when currentImage prop changes
  useEffect(() => {
    setDisplayImage(currentImage || null);
    setImageLoadError(false);
  }, [currentImage]);

  // Handle image load error
  const handleImageError = () => {
    console.warn("Profile picture failed to load in upload component");
    setImageLoadError(true);
    setDisplayImage(null);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoadError(false);
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    setIsUploading(true);
    try {
      await onImageUpload(file);
      toast.success("Profile picture updated successfully!");
      setIsDialogOpen(false);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to upload profile picture");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveCurrentImage = async () => {
    if (!onImageRemove) {
      toast.error("Remove functionality not available");
      return;
    }

    setIsRemoving(true);
    try {
      await onImageRemove();
      setDisplayImage(null);
      toast.success("Profile picture removed successfully!");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to remove profile picture");
      console.error("Remove error:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex items-center space-x-3">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="relative p-0 h-auto w-auto rounded-full hover:opacity-80 transition-opacity"
          >
            <Avatar className={sizeClasses[size]}>
              <AvatarImage 
                src={previewImage || displayImage} 
                alt={userName}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new profile picture. Supported formats: JPG, PNG, GIF. Max size: 5MB.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={previewImage || displayImage} 
                  alt={userName}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="profile-picture">Select Image</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                {previewImage && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Remove Current Image Button */}
            {displayImage && !previewImage && (
              <div className="space-y-2">
                <Label>Current Profile Picture</Label>
                <Button
                  variant="outline"
                  onClick={handleRemoveCurrentImage}
                  disabled={isRemoving}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isRemoving ? "Removing..." : "Remove Current Picture"}
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!previewImage || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePictureUpload; 