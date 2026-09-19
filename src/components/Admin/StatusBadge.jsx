const STATUS_BADGE_CLASS = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  processing: 'badge-accent',
  shipped: 'badge-primary',
  delivered: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
  active: 'badge-success',
  'low stock': 'badge-warning',
  'out of stock': 'badge-error',
  'in stock': 'badge-success',
  admin: 'badge-accent',
  customer: 'badge-ghost',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const badgeClass = STATUS_BADGE_CLASS[key] || 'badge-ghost';
  return (
    <div className={`badge ${badgeClass} capitalize font-medium`}>
      {status}
    </div>
  );
}