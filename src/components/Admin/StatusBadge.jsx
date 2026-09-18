const STATUS_STYLES = {
  pending: { bg: '#9CE1F0', text: '#000000' },
  processing: { bg: '#000000', text: '#9CE1F0' },
  shipped: { bg: '#000000', text: '#9CE1F0' },
  delivered: { bg: '#9CE1F0', text: '#000000' },
  cancelled: { bg: '#000000', text: '#FFFFFF' },
  active: { bg: '#9CE1F0', text: '#000000' },
  'low stock': { bg: '#9CE1F0', text: '#000000' },
  'out of stock': { bg: '#000000', text: '#FFFFFF' },
  'in stock': { bg: '#9CE1F0', text: '#000000' },
  admin: { bg: '#000000', text: '#9CE1F0' },
  customer: { bg: '#F0FBFD', text: '#000000' },
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const style = STATUS_STYLES[key] || { bg: '#F0FBFD', text: '#000000' };
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold capitalize"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status}
    </span>
  );
}