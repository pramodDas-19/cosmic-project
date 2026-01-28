import React, { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SocketTest: React.FC = () => {
  const { socket, notifications, unreadCount } = useSocket();
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  useEffect(() => {
    if (socket) {
      setConnectionStatus('Connected');
      
      socket.on('connect', () => {
        setConnectionStatus('Connected');
        console.log('Socket connected');
      });

      socket.on('disconnect', () => {
        setConnectionStatus('Disconnected');
        console.log('Socket disconnected');
      });

      socket.on('connect_error', (error) => {
        setConnectionStatus('Connection Error');
        console.error('Socket connection error:', error);
      });
    }
  }, [socket]);

  const testNotification = () => {
    if (socket) {
      socket.emit('test:notification', {
        title: 'Test Notification',
        message: 'This is a test notification from the frontend',
        type: 'info'
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Socket Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Connection Status:</span>
          <Badge variant={connectionStatus === 'Connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Unread Notifications:</span>
          <Badge variant="secondary">{unreadCount}</Badge>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Recent Notifications:</span>
          {notifications.slice(0, 3).map((notification, index) => (
            <div key={index} className="text-xs p-2 bg-muted rounded">
              <div className="font-medium">{notification.title}</div>
              <div className="text-muted-foreground">{notification.message}</div>
            </div>
          ))}
        </div>

        <Button onClick={testNotification} disabled={!socket}>
          Send Test Notification
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocketTest; 