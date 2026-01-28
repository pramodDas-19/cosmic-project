import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ExternalLink, MapPin, Clock, User } from "lucide-react";

interface Activity {
  id: string;
  type:
    | "task_assigned"
    | "task_completed"
    | "task_delayed"
    | "project_created"
    | "user_created";
  title: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
    role: "super-admin" | "manager" | "technician";
  };
  timestamp: Date;
  location?: string;
  status?: {
    text: string;
    variant?:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning"
      | "pending";
    className?: string;
  };
  actionUrl?: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
  className?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  className,
  showViewAll = true,
  onViewAll,
}) => {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "task_assigned":
        return "📋";
      case "task_completed":
        return "✅";
      case "task_delayed":
        return "⚠️";
      case "project_created":
        return "🏗️";
      case "user_created":
        return "👤";
      default:
        return "📝";
    }
  };

  const getRoleColor = (role: Activity["user"]["role"]) => {
    switch (role) {
      case "super-admin":
        return "text-primary";
      case "manager":
        return "text-success";
      case "technician":
        return "text-pending";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </div>
          {showViewAll && (
            <Button variant="outline" size="sm" onClick={onViewAll}>
              View All
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl mb-4">
                📝
              </div>
              <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
              <p className="text-muted-foreground text-sm">
                Recent project and task activities will appear here
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Activity Icon */}
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    </div>

                    {activity.status && (
                      <Badge
                        variant={activity.status.variant || "outline"}
                        className={cn(
                          "ml-2 text-xs",
                          activity.status.className,
                        )}
                      >
                        {activity.status.text}
                      </Badge>
                    )}
                  </div>

                  {/* Meta information */}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    {/* User */}
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span
                        className={cn(
                          "font-medium",
                          getRoleColor(activity.user.role),
                        )}
                      >
                        {activity.user.name}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Location */}
                    {activity.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback className="text-xs bg-muted">
                    {activity.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
