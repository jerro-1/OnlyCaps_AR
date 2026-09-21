import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BgImg from '../components/BgImg';
import supabase from '../utils/supabase';

const LOW_STOCK = 5;
const SAVED_SIZE_KEY = 'onlycaps:size';

// Head circumference (cm) of a hat size: a size is the diameter in inches,
// so circumference = size * pi. 7 -> 55.9 cm, 7 3/8 -> 58.8 cm.
const cmFor = (decimal) => decimal * Math.PI * 2.54;

const SIZES = [
  { size: '6 7/8', decimal: 6.875, note: 'Extra snug' },
  { size: '7', decimal: 7, note: 'Narrow crown' },
  { size: '7 1/8', decimal: 7.125, note: 'Snug everyday' },
  { size: '7 1/4', decimal: 7.25, note: 'Classic fit' },
  { size: '7 3/8', decimal: 7.375, note: 'Classic fit' },
  { size: '7 1/2', decimal: 7.5, note: 'Standard-roomy' },
  { size: '7 5/8', decimal: 7.625, note: 'Roomy crown' },
  { size: '7 3/4', decimal: 7.75, note: 'Extra roomy' },
].map(s => ({ ...s, cm: cmFor(s.decimal) }));

const MIN_CM = SIZES[0].cm - 0.5;
const MAX_CM = SIZES[SIZES.length - 1].cm + 0.5;

const STEPS = [
  'Wrap a soft tailor\'s tape around your head about 1.5 cm above the ears and across the middle of the forehead.',
  'Keep it level all the way around. Snug, not tight: one finger should slide under.',
  'Drag the gauge to that number, or read it against the chart.',
];

// Gauge geometry: a 300 degree arc that opens at the bottom
const CX = 90;
const CY = 90;
const R = 74;
const ARC_START = 120;
const ARC_SWEEP = 300;
const CIRC = 2 * Math.PI * R;
const ARC_LEN = CIRC * (ARC_SWEEP / 360);

const nearestSize = (cm) =>
  SIZES.reduce((best, s) => (Math.abs(s.cm - cm) < Math.abs(best.cm - cm) ? s : best), SIZES[0]);

const stockBadge = (qty) => {
  if (qty <= 0) return { label: 'Out', cls: 'bg-[#26262A] text-[#6F6F75]' };
  if (qty <= LOW_STOCK) return { label: 'Low', cls: 'bg-[#3A3A40] text-[#D4D4D8]' };
  return { label: 'In stock', cls: 'bg-[#9CE1F0]/20 text-[#9CE1F0]' };
};

const CapMeasurement = () => {
  const navigate = useNavigate();
  const [unit, setUnit] = useState('cm');
  const [cm, setCm] = useState(() => {
    try {
      const saved = SIZES.find(s => s.size === localStorage.getItem(SAVED_SIZE_KEY));
      if (saved) return saved.cm;
    } catch { /* storage unavailable */ }
    return SIZES[4].cm;
  });
  const [stockBySize, setStockBySize] = useState({});
  const [stylesBySize, setStylesBySize] = useState({});
  const svgRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('products')
      .select('sizes_stock')
      .eq('category', 'fitted')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const stock = {};
        const styles = {};
        data.forEach(p => {
          Object.entries(p.sizes_stock || {}).forEach(([size, qty]) => {
            stock[size] = (stock[size] || 0) + (qty || 0);
            if (qty > 0) styles[size] = (styles[size] || 0) + 1;
          });
        });
        setStockBySize(stock);
        setStylesBySize(styles);
      });
    return () => { cancelled = true; };
  }, []);

  const fitted = useMemo(() => nearestSize(cm), [cm]);
  const fittedStock = stockBySize[fitted.size] || 0;
  const fittedStyles = stylesBySize[fitted.size] || 0;

  const t = (cm - MIN_CM) / (MAX_CM - MIN_CM);
  const knobAngle = ((ARC_START + t * ARC_SWEEP) * Math.PI) / 180;
  const knobX = CX + R * Math.cos(knobAngle);
  const knobY = CY + R * Math.sin(knobAngle);

  const display = (value) => (unit === 'cm' ? `${value.toFixed(1)} cm` : `${(value / 2.54).toFixed(1)}"`);

  const setFromPointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scale = rect.width / 180;
    const dx = e.clientX - (rect.left + CX * scale);
    const dy = e.clientY - (rect.top + CY * scale);
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    let rel = (angle - ARC_START + 360) % 360;
    if (rel > ARC_SWEEP) rel = rel > ARC_SWEEP + (360 - ARC_SWEEP) / 2 ? 0 : ARC_SWEEP;
    setCm(MIN_CM + (rel / ARC_SWEEP) * (MAX_CM - MIN_CM));
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e);
  };
  const onPointerMove = (e) => { if (dragging.current) setFromPointer(e); };
  const onPointerUp = () => { dragging.current = false; };

  const saveSize = () => {
    try { localStorage.setItem(SAVED_SIZE_KEY, fitted.size); } catch { /* storage unavailable */ }
    navigate(`/fitted-caps?size=${encodeURIComponent(fitted.size)}`);
  };

  return (
    <>
      <BgImg>
        <Header />
        <div className="min-h-screen pt-32 pb-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">

              {/* Left: intro + chart */}
              <div>
                <p className="text-[#9CE1F0] text-xs uppercase tracking-[0.2em] font-body mb-3">
                  Get it right the first time
                </p>
                <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-wide text-[#F2F2F3] leading-tight mb-4">
                  Find your fit
                </h1>
                <p className="font-body text-[#A3A3A8] text-base leading-relaxed max-w-xl">
                  Every silhouette sits differently. Read the chart, or drag the gauge and we'll call
                  your size and save it across the whole shop.
                </p>

                <ol className="mt-8 space-y-3 max-w-xl">
                  {STEPS.map((step, i) => (
                    <li key={i} className="flex gap-4 font-body text-sm text-[#A3A3A8] leading-relaxed">
                      <span className="font-heading text-[#9CE1F0] flex-shrink-0">0{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="border-t border-dashed border-[#FFFFFF]/20 mt-10 mb-6" />

                <span className="inline-block bg-[#9CE1F0] text-[#0B0B0C] font-body text-xs font-medium uppercase tracking-wider px-5 py-2.5 rounded-full">
                  Fitted
                </span>

                <div className="overflow-x-auto mt-6">
                  <table className="w-full font-body text-sm text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-[#A3A3A8]">
                        <th className="pb-3 font-medium">Size</th>
                        <th className="pb-3 font-medium">Head circ.</th>
                        <th className="pb-3 font-medium">Fit note</th>
                        <th className="pb-3 font-medium text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZES.map(row => {
                        const badge = stockBadge(stockBySize[row.size] || 0);
                        const active = row.size === fitted.size;
                        return (
                          <tr
                            key={row.size}
                            onClick={() => setCm(row.cm)}
                            className={`border-t border-[#F2F2F3]/15 cursor-pointer transition-colors ${active ? 'bg-[#F2F2F3]/10' : 'hover:bg-[#F2F2F3]/5'}`}
                          >
                            <td className="py-3.5 pl-2 font-semibold text-[#9CE1F0]">{row.size}</td>
                            <td className="py-3.5 text-[#F2F2F3]">{display(row.cm)}</td>
                            <td className="py-3.5 text-[#A3A3A8]">{row.note}</td>
                            <td className="py-3.5 pr-2 text-right">
                              <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="font-body text-xs text-[#A3A3A8] leading-relaxed mt-6 max-w-lg">
                  Between two sizes? Size up. Fitted caps break in and relax slightly with wear.
                </p>
              </div>

              {/* Right: head gauge */}
              <div className="bg-[#141416] border border-[#2A2A2E] rounded-2xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] lg:sticky lg:top-28">
                <h2 className="font-heading text-xl uppercase tracking-wide text-[#F2F2F3] mb-2">
                  Head gauge
                </h2>
                <p className="font-body text-xs text-[#9A9A9F] leading-relaxed mb-6">
                  Drag to your measurement. We'll call your fitted size and filter the shop to what's
                  actually in stock for you.
                </p>

                <div className="flex justify-center">
                  <svg
                    ref={svgRef}
                    viewBox="0 0 180 180"
                    className="w-52 h-52 touch-none select-none cursor-pointer"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    role="slider"
                    aria-label="Head circumference"
                    aria-valuemin={MIN_CM}
                    aria-valuemax={MAX_CM}
                    aria-valuenow={Number(cm.toFixed(1))}
                  >
                    <circle
                      cx={CX} cy={CY} r={R} fill="none" stroke="#2E2E33" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${ARC_LEN} ${CIRC}`}
                      transform={`rotate(${ARC_START} ${CX} ${CY})`}
                    />
                    <circle
                      cx={CX} cy={CY} r={R} fill="none" stroke="#9CE1F0" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${Math.max(t * ARC_LEN, 0.01)} ${CIRC}`}
                      transform={`rotate(${ARC_START} ${CX} ${CY})`}
                    />
                    <circle cx={knobX} cy={knobY} r="9" fill="#141416" stroke="#9CE1F0" strokeWidth="3" />
                    <text x={CX} y={CY + 4} textAnchor="middle" className="font-heading" fontSize="30" fill="#9CE1F0">
                      {fitted.size}
                    </text>
                    <text x={CX} y={CY + 24} textAnchor="middle" fontSize="8" letterSpacing="1.2" fill="#9A9A9F">
                      FITTED SIZE
                    </text>
                  </svg>
                </div>

                <div className="flex justify-center gap-2 mt-2 mb-6">
                  {['cm', 'in'].map(u => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`px-4 py-1 rounded-full font-body text-[11px] uppercase tracking-wider border cursor-pointer transition-colors ${
                        unit === u
                          ? 'bg-[#9CE1F0] text-[#0B0B0C] border-[#9CE1F0]'
                          : 'bg-transparent text-[#9A9A9F] border-[#3A3A40] hover:bg-[#1F1F23]'
                      }`}
                    >
                      {u === 'cm' ? 'CM' : 'Inches'}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between font-body text-[11px] uppercase tracking-wider text-[#9A9A9F] mb-2">
                  <span>Head circumference</span>
                  <span className="text-[#F2F2F3] font-semibold">{display(cm)}</span>
                </div>
                <input
                  type="range"
                  min={MIN_CM}
                  max={MAX_CM}
                  step="0.1"
                  value={cm}
                  onChange={e => setCm(parseFloat(e.target.value))}
                  className="w-full accent-[#9CE1F0] cursor-pointer"
                  aria-label="Head circumference"
                />

                <div className="bg-[#1F1F23] rounded-xl p-4 mt-6 space-y-2 font-body text-xs">
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider text-[#9A9A9F]">Fitted</span>
                    <span className="font-semibold text-[#F2F2F3]">{fitted.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider text-[#9A9A9F]">In stock right now</span>
                    <span className="font-semibold text-[#F2F2F3]">
                      {fittedStock} {fittedStock === 1 ? 'piece' : 'pieces'} across {fittedStyles} {fittedStyles === 1 ? 'style' : 'styles'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={saveSize}
                  className="w-full bg-[#9CE1F0] text-[#0B0B0C] font-body text-sm font-medium py-3 rounded-full mt-5 hover:bg-[#B4EAF5] transition-colors border-none cursor-pointer"
                >
                  Save my size
                </button>
              </div>

            </div>
          </div>
        </div>
      </BgImg>
      <Footer />
    </>
  );
};

export default CapMeasurement;
