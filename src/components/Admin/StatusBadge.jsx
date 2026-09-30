// OnlyCaps' fixed status palette (not daisyUI's theme colors, which drift
// with whatever theme is active and don't distinguish "in progress" from
// "done"): green/amber/red for good/warning/bad everywhere in the system,
// plus a calm blue for "in progress, nothing wrong yet" and gray for
// neutral/no-action states. Every status this admin panel shows maps to
// exactly one of these five.
const TONES = {
  success: { bg: '#22c55e1a', text: '#15803d', dot: '#22c55e' },
  warning: { bg: '#f59e0b1a', text: '#92400e', dot: '#f59e0b' },
  error: { bg: '#E106001a', text: '#E10600', dot: '#E10600' },
  info: { bg: '#3b82f61a', text: '#1d4ed8', dot: '#3b82f6' },
  neutral: { bg: '#6b72801a', text: '#4b5563', dot: '#9ca3af' },
};

const STATUS_TONE = {
  // Order lifecycle
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
  // Payment status
  paid: 'success',
  unpaid: 'warning',
  failed: 'error',
  refunded: 'neutral',
  flagged: 'error',
  // Inventory
  active: 'success',
  'low stock': 'warning',
  'out of stock': 'error',
  'in stock': 'success',
  // Roles
  admin: 'info',
  customer: 'neutral',
};

export default function StatusBadge({ status, label }) {
  const key = (status || '').toLowerCase();
  const tone = TONES[STATUS_TONE[key]] || TONES.neutral;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap"
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tone.dot }} />
      {label ?? status}
    </span>
  );
}
