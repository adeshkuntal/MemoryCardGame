export default function Card({ symbol, flipped, matched, onClick }) {
  return (
    <div className="w-20 h-28 md:w-24 md:h-32 perspective" onClick={onClick}>
      <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${flipped || matched ? "rotate-y-180" : ""}`}>
        {/* Front (hidden) */}
        <div className="absolute inset-0 bg-indigo-500 rounded-xl shadow backface-hidden flex items-center justify-center text-2xl text-white">
          ❓
        </div>
        {/* Back (revealed) */}
        <div className="absolute inset-0 bg-white rounded-xl shadow backface-hidden rotate-y-180 flex items-center justify-center text-4xl">
          <span>{symbol}</span>
        </div>
      </div>
    </div>
  );
}
