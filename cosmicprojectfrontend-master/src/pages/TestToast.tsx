import React from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const TestToast = () => {
  const testToasts = () => {
    toast.success('Success notification!');
    toast.error('Error notification!');
    toast('Default notification!');
    toast.loading('Loading notification...');
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Toast Notification Test</h1>
      <p className="text-muted-foreground">
        Click the button below to test different types of toast notifications.
      </p>
      <Button onClick={testToasts}>
        Test All Toast Types
      </Button>
    </div>
  );
};

export default TestToast; 