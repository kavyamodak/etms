import { useNotify } from '../context/NotificationContext';
import PremiumNotification from './PremiumNotification';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotify();

  if (notifications.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        pointerEvents: 'none',
      }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{ pointerEvents: 'auto', width: '100%' }}
        >
          <PremiumNotification
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
