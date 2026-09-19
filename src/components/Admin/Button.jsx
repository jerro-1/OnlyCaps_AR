const ACCENT = '#00BFFF';
const INK = '#16181D';
const BORDER = '#EBEBE8';

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  const base = "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary: { backgroundColor: ACCENT, color: '#083344' },
    outline: { backgroundColor: 'transparent', color: INK, border: `1px solid ${BORDER}` },
    ghost: { backgroundColor: 'transparent', color: '#6B6B66' },
  };

  return (
    <button className={`${base} ${className}`} style={variants[variant]} {...props}>
      {children}
    </button>
  );
}