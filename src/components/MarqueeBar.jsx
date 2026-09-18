export default function MarqueeBar() {
  const message = "FREE FITTING PREVIEW — AUTHENTIC LICENSED CAPS — SHOP THE NEW COLLECTION —";
  return (
    <div className="w-full bg-black overflow-hidden py-2 border-b border-white/10">
      <div className="flex whitespace-nowrap animate-marquee">
        {Array(6).fill(message).map((msg, i) => (
          <span key={i} className="text-white text-xs font-bold tracking-wider mx-4">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}