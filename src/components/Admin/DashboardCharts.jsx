// Plain inline SVG, no charting library -- keeps this admin-only page light
// (see the standing goal to avoid pulling in heavy dependencies for anything
// that doesn't need them). Colors follow OnlyCaps' own status palette where a
// chart shows state, and a validated 4-hue categorical set (blue/orange/aqua/
// yellow, run through the dataviz palette validator) where it shows identity.

const INK_MUTED = '#898781';
const GRID = '#EBEBE8';
const BLUE = '#2a78d6';

const CATEGORY_META = {
  fitted: { label: 'Fitted Caps', color: '#2a78d6' },
  aframe: { label: 'A-Frames', color: '#eb6834' },
  trucker: { label: 'Trucker', color: '#1baf7a' },
  more: { label: 'More Stuff', color: '#eda100' },
};

const peso = (n) => `₱${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function ChartCard({ title, subtitle, empty, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mb-3">{subtitle}</p>}
      {empty ? (
        <p className="text-sm text-gray-400 py-10 text-center">Not enough data yet.</p>
      ) : children}
    </div>
  );
}

// Daily paid revenue over the trailing window. A single series needs no
// legend -- the card title names it.
export function SalesTrendChart({ data }) {
  if (!data.length) return <ChartCard title="Sales trend (last 30 days)" empty />;

  const W = 560, H = 160, padL = 8, padR = 8, padT = 12, padB = 22;
  const max = Math.max(1, ...data.map(d => d.total));
  const x = (i) => padL + (i / (data.length - 1 || 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.total).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;

  const first = data[0], last = data[data.length - 1];
  const totalRevenue = data.reduce((s, d) => s + d.total, 0);

  return (
    <ChartCard title="Sales trend (last 30 days)" subtitle={`${peso(totalRevenue)} confirmed revenue this window`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={padL} x2={W - padR} y1={padT + f * (H - padT - padB)} y2={padT + f * (H - padT - padB)} stroke={GRID} strokeWidth="1" />
        ))}
        <path d={areaPath} fill={BLUE} opacity="0.08" stroke="none" />
        <path d={linePath} fill="none" stroke={BLUE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={d.date} cx={x(i)} cy={y(d.total)} r={i === data.length - 1 ? 3.5 : 2} fill={BLUE}>
            <title>{`${d.date}: ${peso(d.total)}`}</title>
          </circle>
        ))}
        <text x={padL} y={H - 4} fontSize="10" fill={INK_MUTED}>{first.date}</text>
        <text x={W - padR} y={H - 4} fontSize="10" fill={INK_MUTED} textAnchor="end">{last.date}</text>
      </svg>
    </ChartCard>
  );
}

// Magnitude ranking across many possible products -> one hue, not one color
// per bar (a distinct color per product would imply identity that a "top 5"
// cut doesn't have, and would run out of safe hues past a handful of items).
export function TopProductsChart({ data }) {
  if (!data.length) return <ChartCard title="Top products" empty />;

  const max = Math.max(1, ...data.map(d => d.revenue));
  return (
    <ChartCard title="Top products" subtitle="By confirmed revenue">
      <div className="space-y-2.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-28 shrink-0 truncate" title={d.name}>{d.name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(4, (d.revenue / max) * 100)}%`, background: BLUE }}
                title={peso(d.revenue)}
              />
            </div>
            <span className="text-xs font-semibold text-gray-900 w-16 text-right shrink-0">{peso(d.revenue)}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// Identity across a fixed, known set of 4 categories -> fixed hue per
// category, always in the same order, with the value written directly on
// each bar (two of these four hues read under 3:1 against white, so a
// visible label -- not color alone -- is what actually carries the value).
export function CategoryRevenueChart({ data }) {
  if (!data.length) return <ChartCard title="Revenue by category" empty />;

  const max = Math.max(1, ...data.map(d => d.revenue));
  const W = 280, H = 160, barW = 44, gap = 22, padB = 20, padT = 22;
  const chartH = H - padT - padB;

  return (
    <ChartCard title="Revenue by category" subtitle="Confirmed revenue">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <line x1={0} x2={W} y1={H - padB} y2={H - padB} stroke={GRID} strokeWidth="1" />
        {data.map((d, i) => {
          const h = Math.max(2, (d.revenue / max) * chartH);
          const bx = i * (barW + gap) + gap / 2;
          const by = H - padB - h;
          return (
            <g key={d.category}>
              <rect x={bx} y={by} width={barW} height={h} rx="4" fill={d.color}>
                <title>{`${d.label}: ${peso(d.revenue)}`}</title>
              </rect>
              <text x={bx + barW / 2} y={by - 5} fontSize="9.5" fill="#4A4536" textAnchor="middle" fontWeight="600">
                {peso(d.revenue)}
              </text>
              <text x={bx + barW / 2} y={H - 6} fontSize="9.5" fill={INK_MUTED} textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartCard>
  );
}

export { CATEGORY_META };
