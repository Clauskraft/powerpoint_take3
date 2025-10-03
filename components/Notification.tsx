import React from 'react';
import { Notification as NotificationProps } from '../types';

interface NotificationsContainerProps {
  notifications: NotificationProps[];
  onDismiss: (id: number) => void;
}

const Notification: React.FC<NotificationsContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div key={notification.id} className={`notification-toast ${notification.type}`}>
          <p>{notification.message}</p>
          <button onClick={() => onDismiss(notification.id)} className="notification-dismiss">&times;</button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
