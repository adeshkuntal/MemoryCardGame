export default function Card({ symbol, flipped, matched, onClick }) {
  return (
    <div 
      className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 perspective cursor-pointer ${
        matched ? "opacity-80" : ""
      }`}
      onClick={onClick}
    >
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
        flipped || matched ? "rotate-y-180" : ""
      }`}>
        {/* Front (hidden) */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md backface-hidden flex items-center justify-center text-2xl text-white">
          ❓
        </div>
        {/* Back (revealed) */}
        <div className="absolute inset-0 bg-white rounded-xl shadow-md backface-hidden rotate-y-180 flex items-center justify-center text-4xl">
          <span>{symbol}</span>
        </div>
      </div>
    </div>
  );
}