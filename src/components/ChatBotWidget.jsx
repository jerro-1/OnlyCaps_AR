import { useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../utils/supabase';

const BUDGET_OPTIONS = [
  { id: 'low', label: 'Under ₱500', min: 0, max: 500 },
  { id: 'mid', label: '₱500 – ₱700', min: 500, max: 700 },
  { id: 'high', label: '₱700+', min: 700, max: 999999 },
];

const STYLE_OPTIONS = [
  { id: 'fitted', label: 'Fitted Caps' },
  { id: 'aframe', label: 'A-Frames' },
  { id: 'trucker', label: 'Trucker' },
  { id: 'any', label: 'Surprise me' },
];

const CATEGORY_ROUTES = { fitted: '/fitted-caps', aframe: '/a-frames', trucker: '/trucker', more: '/more-stuff' };

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('welcome');
  const [budget, setBudget] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const reset = () => { setStep('welcome'); setBudget(null); setResults([]); };

  const pickBudget = (opt) => { setBudget(opt); setStep('style'); };

  const pickStyle = async (opt) => {
    setLoading(true);
    let query = supabase.from('products').select('*').eq('active', true)
      .gte('price', budget.min).lte('price', budget.max).limit(4);
    if (opt.id !== 'any') query = query.eq('category', opt.id);
    const { data, error } = await query;
    setLoading(false);
    setResults(error ? [] : (data || []));
    setStep('results');
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#14110D] text-[#FAF8F4] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] flex items-center justify-center z-[100] hover:bg-[#2A241C] transition-colors"
        aria-label="Cap finder assistant"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.17 0-2.29-.2-3.31-.57L3 21l1.67-4.17C3.61 15.36 3 13.74 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-80 bg-[#FAF8F4] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-[#E4DFD3] z-[100] overflow-hidden flex flex-col max-h-[70vh]">
          <div className="bg-[#14110D] px-5 py-4">
            <p className="font-heading text-sm uppercase tracking-wide text-[#FAF8F4]">Cap Finder</p>
            <p className="font-body text-xs text-[#B8B2A3] mt-0.5">A couple questions, then a few picks</p>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            {step === 'welcome' && (
              <div>
                <p className="font-body text-sm text-[#14110D] mb-4">Hey! What's your budget?</p>
                <div className="space-y-2">
                  {BUDGET_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => pickBudget(opt)}
                      className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E4DFD3] font-body text-sm text-[#14110D] hover:border-[#A9824C] hover:bg-[#F5EEE2] transition-colors">
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'style' && (
              <div>
                <p className="font-body text-sm text-[#14110D] mb-4">Got it. What style are you into?</p>
                <div className="space-y-2">
                  {STYLE_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => pickStyle(opt)}
                      className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E4DFD3] font-body text-sm text-[#14110D] hover:border-[#A9824C] hover:bg-[#F5EEE2] transition-colors">
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'results' && (
              <div>
                {loading ? (
                  <p className="font-body text-sm text-[#6B6558]">Finding picks...</p>
                ) : results.length === 0 ? (
                  <p className="font-body text-sm text-[#6B6558]">
                    Nothing matched exactly — try a wider budget next time.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {results.map(p => (
                      <Link key={p.id} to={CATEGORY_ROUTES[p.category] || '/fitted-caps'}
                        className="flex gap-3 items-center p-2 rounded-xl hover:bg-[#F0ECE1] transition-colors">
                        <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-[#14110D] truncate">{p.name}</p>
                          <p className="font-body text-xs text-[#A9824C]">₱{p.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <button onClick={reset} className="mt-4 font-body text-xs text-[#6B6558] underline bg-transparent border-none cursor-pointer">
                  Start over
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}