import { useCart } from '../context/CartContext';

// Same green/amber/red used for stock status everywhere else in the app
const BG = { success: '#22c55e', error: '#E10600', warning: '#f59e0b' };

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
