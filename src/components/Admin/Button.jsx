const ACCENT = '#00BFFF';
const BORDER = '#C7CBD1';

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  const base = "px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary: { backgroundColor: ACCENT, color: '#083344' },
    accent: { backgroundColor: 'transparent', color: '#1F2937', border: `1.5px solid ${BORDER}` },
    outline: { backgroundColor: 'transparent', color: '#1F2937', border: `1.5px solid ${BORDER}` },
    ghost: { backgroundColor: 'transparent', color: '#6B6B66' },
  };

  const hoverClass = {
    primary: 'hover:opacity-90',
    accent: 'hover:bg-gray-100 hover:border-gray-400',
    outline: 'hover:bg-gray-100 hover:border-gray-400',
    ghost: 'hover:bg-gray-100',
  };

  return (
    <button className={`${base} ${hoverClass[variant]} ${className}`} style={variants[variant]} {...props}>
      {children}
    </button>
  );
}