import React from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellRing,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  ClipboardList,
  Settings,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPriorityClasses } from "@/utils/statusStyles";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "info":
      return <Bell className="h-4 w-4 text-primary" />;
    case "system":
      return <Settings className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  return getPriorityClasses(priority);
};

export const NotificationBell: React.FC<{ className?: string }> = ({
  className,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useSocket();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const sortedNotifications = [...notifications].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const visibleNotifications =
    filter === "unread"
      ? sortedNotifications.filter((notification) => !notification.isRead)
      : sortedNotifications;

  const recentNotifications = visibleNotifications.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-90 max-h-[600px]"
        align="end"
        forceMount
      >
        <div className="flex items-center justify-between p-4">
          <DropdownMenuLabel className="text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant={filter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "unread" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setFilter("unread")}
                >
                  Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </Button>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "No unread notifications" : "No notifications"}
            </p>
            {filter === "all" && (
              <p className="text-xs text-muted-foreground">
                You're all caught up!
              </p>
            )}
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                    !notification.isRead
                      ? "bg-primary/5 border-l-primary"
                      : "border-l-transparent",
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm leading-tight",
                              !notification.isRead && "font-medium",
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getPriorityColor(notification.priority),
                            )}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
