import { useState, useEffect } from 'react';
import FlagCaptureNotification from './FlagCaptureNotification';

interface Notification {
  id: string;
  challengeTitle: string;
  points: number;
}

interface FlagNotificationManagerProps {
  trigger: { title: string; points: number } | null;
}

export default function FlagNotificationManager({ trigger }: FlagNotificationManagerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (trigger) {
      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        challengeTitle: trigger.title,
        points: trigger.points,
      };
      setNotifications(prev => [...prev, newNotification]);
    }
  }, [trigger]);

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {notifications.map((notification) => (
        <FlagCaptureNotification
          key={notification.id}
          challengeTitle={notification.challengeTitle}
          points={notification.points}
          onClose={() => handleClose(notification.id)}
        />
      ))}
    </>
  );
}
