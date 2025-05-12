import React, { useEffect } from 'react';
import { useNotificationStore } from '../../lib/store';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  // Auto-remove notifications after their duration
  useEffect(() => {
    notifications.forEach((notification) => {
      const duration = notification.duration || 3000;
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
      
      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-500';
      case 'error':
        return 'bg-error-500';
      case 'warning':
        return 'bg-warning-500';
      case 'info':
      default:
        return 'bg-primary-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBackgroundColor(notification.type)} text-white p-4 rounded-lg shadow-lg flex items-start animate-fadeIn`}
          style={{ minWidth: '300px' }}
        >
          <div className="mr-3 mt-0.5">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;