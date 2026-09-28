import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../utils/supabase';

// A loose grid of cap icons that drift and slowly rotate on their own, and
// nudge in response to the cursor (parallax) -- an emoji rather than an image
// asset so there's nothing to load and it never breaks.
function FloatingCaps({ parallax }) {
  const caps = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    top: 4 + Math.random() * 92,
    left: 4 + Math.random() * 92,
    size: 22 + Math.random() * 26,
    duration: 7 + Math.random() * 7,
    delay: Math.random() * -10,
    rotate: Math.random() * 50 - 25,
    depth: 0.5 + Math.random(), // how strongly this cap reacts to the cursor
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {caps.map(cap => (
        <span
          key={cap.id}
          className="absolute select-none opacity-10"
          style={{
            top: `${cap.top}%`,
            left: `${cap.left}%`,
            fontSize: `${cap.size}px`,
            '--rotate': `${cap.rotate}deg`,
            // Cursor offset lives in its own CSS vars so it composes with the
            // ongoing float/rotate keyframes below instead of fighting them
            '--px': `${parallax.x * cap.depth}px`,
            '--py': `${parallax.y * cap.depth}px`,
            animation: `capFloat ${cap.duration}s ease-in-out ${cap.delay}s infinite`,
          }}
        >
          🧢
        </span>
      ))}
    </div>
  );
}

// Each question maps to a real signal we can filter products by (fit -> category,
// budget -> price range) except visor/crown/occasion, which we don't store on a
// product yet -- those still shape the personalized blurb on the results screen,
// they just don't narrow the database query themselves.
const QUESTIONS = [
  {
    key: 'fit',
    title: 'How do you like your cap to fit?',
    subtitle: 'This helps us narrow down the right closure style for you.',
    options: [
      { id: 'fitted', label: 'Fitted', hint: 'Snug and precise', category: 'fitted' },
      { id: 'adjustable', label: 'Adjustable', hint: 'Flexible and easy', category: 'aframe' },
      { id: 'snapback', label: 'Snapback', hint: 'Classic and adjustable', category: 'trucker' },
      { id: 'stretch', label: 'Stretch-Fit', hint: 'Best of both', category: 'more' },
    ],
  },
  {
    key: 'visor',
    title: 'What visor style do you prefer?',
    subtitle: 'Flat or curved -- each gives a different look.',
    options: [
      { id: 'flat', label: 'Flat Visor', hint: 'Bold and modern' },
      { id: 'curved', label: 'Curved Visor', hint: 'Classic and relaxed' },
      { id: 'none', label: 'No Preference' },
    ],
  },
  {
    key: 'crown',
    title: 'What crown structure do you like?',
    subtitle: 'Structured crowns hold their shape, unstructured ones are softer.',
    options: [
      { id: 'structured', label: 'Structured', hint: 'Holds its shape' },
      { id: 'unstructured', label: 'Unstructured', hint: 'Soft and relaxed' },
      { id: 'none', label: 'No Preference' },
    ],
  },
  {
    key: 'occasion',
    title: 'When will you mostly wear it?',
    subtitle: 'Different caps suit different vibes.',
    options: [
      { id: 'casual', label: 'Everyday Casual' },
      { id: 'sports', label: 'Sports and Athletics' },
      { id: 'street', label: 'Streetwear and Style' },
      { id: 'golf', label: 'Golf and Outdoors' },
    ],
  },
  {
    key: 'budget',
    title: "What's your budget?",
    subtitle: "We'll only recommend picks that fit it.",
    options: [
      { id: 'low', label: 'Under ₱500', min: 0, max: 500 },
      { id: 'mid', label: '₱500 – ₱700', min: 500, max: 700 },
      { id: 'high', label: '₱700+', min: 700, max: 999999 },
    ],
  },
];

const CATEGORY_ROUTES = { fitted: '/fitted-caps', aframe: '/a-frames', trucker: '/trucker', more: '/more-stuff' };

const findOption = (qKey, optId) => QUESTIONS.find(q => q.key === qKey)?.options.find(o => o.id === optId);

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState('intro'); // intro | 0-4 | loading | results
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    setParallax({
      x: (e.clientX / innerWidth - 0.5) * 24,
      y: (e.clientY / innerHeight - 0.5) * 24,
    });
  };

  const reset = () => { setStage('intro'); setAnswers({}); setResults([]); };
  const close = () => { setOpen(false); reset(); };

  const selectAnswer = (question, option) => {
    const nextAnswers = { ...answers, [question.key]: option.id };
    setAnswers(nextAnswers);

    const index = QUESTIONS.indexOf(question);
    if (index < QUESTIONS.length - 1) {
      setTimeout(() => setStage(index + 1), 200); // brief pause so the selection is visible before advancing
    } else {
      setTimeout(() => runSearch(nextAnswers), 200);
    }
  };

  const goBack = () => {
    if (stage === 0) { setStage('intro'); return; }
    if (typeof stage === 'number') setStage(stage - 1);
  };

  const runSearch = async (finalAnswers) => {
    setStage('loading');
    const fitOption = findOption('fit', finalAnswers.fit);
    const budgetOption = findOption('budget', finalAnswers.budget);

    let query = supabase.from('products').select('*').eq('active', true)
      .gte('price', budgetOption?.min ?? 0).lte('price', budgetOption?.max ?? 999999).limit(3);
    if (fitOption?.category) query = query.eq('category', fitOption.category);

    const { data, error } = await query;
    setResults(error ? [] : (data || []));
    setStage('results');
  };

  const currentQuestion = typeof stage === 'number' ? QUESTIONS[stage] : null;
  const progress = typeof stage === 'number' ? ((stage + 1) / QUESTIONS.length) * 100 : 0;

  const occasionLabel = findOption('occasion', answers.occasion)?.label?.toLowerCase();
  const visorLabel = findOption('visor', answers.visor)?.label?.toLowerCase();

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#14110D] text-[#FAF8F4] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] flex items-center justify-center z-100 hover:bg-[#2A241C] transition-colors border-none cursor-pointer"
        aria-label="Find your fit assistant"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 bg-[#0B0B0C] z-100 overflow-y-auto" onMouseMove={handleMouseMove}>
          <FloatingCaps parallax={parallax} />

          <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10">
            <span className="font-heading text-sm uppercase tracking-widest text-white">OnlyCaps AI Stylist</span>
            <button onClick={close} className="text-white/70 hover:text-white bg-transparent border-none cursor-pointer" aria-label="Close">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
            {stage === 'intro' && (
              <div className="text-center">
                <p className="font-heading text-4xl md:text-5xl uppercase tracking-wide text-white mb-4">Find Your Fit</p>
                <p className="font-body text-[#A3A3A8] text-base max-w-md mx-auto mb-8">
                  Answer a few quick questions and we'll recommend your top picks.
                </p>
                <button
                  onClick={() => setStage(0)}
                  className="bg-white text-[#0B0B0C] font-body font-semibold px-8 py-3.5 rounded-full hover:bg-gray-200 transition-colors border-none cursor-pointer"
                >
                  Start Quiz
                </button>
              </div>
            )}

            {currentQuestion && (
              <div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-[#9CE1F0] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="font-body text-xs text-[#A3A3A8] mb-6">Question {stage + 1} of {QUESTIONS.length}</p>

                <h2 className="font-heading text-2xl md:text-3xl text-white mb-2">{currentQuestion.title}</h2>
                <p className="font-body text-sm text-[#A3A3A8] mb-8">{currentQuestion.subtitle}</p>

                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map(opt => {
                    const selected = answers[currentQuestion.key] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => selectAnswer(currentQuestion, opt)}
                        className={`w-full text-left px-5 py-4 rounded-xl border-2 font-body transition-colors cursor-pointer ${
                          selected ? 'border-[#9CE1F0] bg-[#9CE1F0]/10' : 'border-white/15 hover:border-white/40'
                        }`}
                      >
                        <span className="text-white font-medium">{opt.label}</span>
                        {opt.hint && <span className="block text-xs text-[#A3A3A8] mt-0.5">{opt.hint}</span>}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={goBack}
                  className="bg-white/10 text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-white/20 transition-colors border-none cursor-pointer"
                >
                  Back
                </button>
              </div>
            )}

            {stage === 'loading' && (
              <div className="text-center py-20">
                <div className="try-on-spinner mx-auto mb-4" />
                <p className="font-body text-sm text-[#A3A3A8]">Finding your top picks…</p>
              </div>
            )}

            {stage === 'results' && (
              <div>
                <h2 className="font-heading text-2xl md:text-3xl text-white mb-2">Your Top Picks</h2>
                <p className="font-body text-sm text-[#A3A3A8] mb-8">
                  {results.length > 0
                    ? `Picked for ${occasionLabel || 'everyday'} wear${visorLabel ? ` with a ${visorLabel}` : ''}, within your budget.`
                    : "Nothing matched exactly in stock right now -- try a wider budget next time."}
                </p>

                <div className="space-y-3 mb-8">
                  {results.map(p => (
                    <Link
                      key={p.id}
                      to={CATEGORY_ROUTES[p.category] || '/fitted-caps'}
                      onClick={close}
                      className="flex gap-4 items-center p-3 rounded-xl border border-white/10 hover:border-white/30 transition-colors no-underline"
                    >
                      <img src={p.image} alt={p.full_name ?? p.name} className="w-16 h-16 object-cover rounded-lg bg-white shrink-0" />
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold text-white truncate">{p.name}</p>
                        <p className="font-body text-sm text-[#9CE1F0]">₱{p.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={reset} className="bg-white/10 text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-white/20 transition-colors border-none cursor-pointer">
                    Start Over
                  </button>
                  <button onClick={close} className="bg-white text-[#0B0B0C] font-body text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors border-none cursor-pointer">
                    Keep Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
