import React, { useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSocket } from '@/contexts/SocketContext';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative mobile-button"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto mobile-dialog-content"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="mobile-text-base font-semibold">Notifications</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotifications();
                }}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="mobile-text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50",
                  !notification.isRead && "bg-blue-50 dark:bg-blue-950/20"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <span className="text-lg mt-0.5">
                  {getNotificationIcon(notification.type)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "mobile-text-sm font-medium line-clamp-1",
                      !notification.isRead && "font-semibold"
                    )}>
                      {notification.title}
                    </p>
                    <span className="mobile-text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className="mobile-text-xs text-muted-foreground line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                  
                  {notification.priority === 'urgent' && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      URGENT
                    </Badge>
                  )}
                </div>
                
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            
            {notifications.length > 10 && (
              <div className="p-2 text-center">
                <p className="mobile-text-xs text-muted-foreground">
                  +{notifications.length - 10} more notifications
                </p>
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell; 