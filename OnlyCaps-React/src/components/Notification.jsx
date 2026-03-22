import { useCart } from '../context/CartContext';

const BG = { success: '#10b981', error: '#ef4444', warning: '#f59e0b' };

export default function Notification() {
  const { notification } = useCart();
  if (!notification) return null;

  return (
    <div
      className="notification"
      style={{ backgroundColor: BG[notification.type] || BG.success }}
    >
      {notification.message}
    </div>
  );
}
