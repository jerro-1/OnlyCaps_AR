// One shared filter/tab row for every admin page (Orders' status tabs,
// Payments' status tabs, Products' category tabs, ...). Before this, each
// page had its own button markup and its own idea of what "selected" looked
// like -- daisyUI's btn-neutral/btn-primary, which render near-black or an
// arbitrary theme color depending on context, not this dashboard's actual
// design. Nothing here is ever black: a tab with no inherent status meaning
// (an "All" tab, a product category) highlights in the dashboard's own cyan
// accent when selected; a tab that IS a status (pending, paid, cancelled...)
// highlights in that status's own color instead, via the `color` prop.
const ACCENT = '#00BFFF';
const BORDER = '#D9D9D4';

export default function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => {
        const isActive = active === t.value;
        const color = t.color || ACCENT;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`admin-filter-tab${isActive ? ' is-active' : ''} px-3 py-1.5 rounded-full text-sm font-medium capitalize border transition-colors flex items-center gap-1.5 whitespace-nowrap`}
            style={isActive
              ? { background: `${color}1a`, borderColor: color, color }
              : { background: '#FFFFFF', borderColor: BORDER, color: '#4B5563' }}
          >
            {t.color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
            {t.label ?? t.value}
            {t.count !== undefined && <span className="opacity-70">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
