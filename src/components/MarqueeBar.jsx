export default function MarqueeBar() {
  const message =
    'SHOP THE NEW COLLECTION — BUY 2 HATS FOR ₱1,300 ONLY — 10,000+ ORDERS SHIPPED — FREE SHIPPING ON ORDERS OVER ₱1,500';
  return (
    <div className="top-0 left-0 right-0 z-60 h-9 flex items-center bg-base-100 overflow-hidden border-b border-base-300">
      <div className="flex whitespace-nowrap animate-marquee">
        {Array(6)
          .fill(message)
          .map((msg, i) => (
            <span key={i} className="text-base-content/70 text-xs font-medium tracking-wider mx-4">
              {msg}
            </span>
          ))}
      </div>
    </div>
  );
}