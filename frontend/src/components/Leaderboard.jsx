export default function Leaderboard({ leaderboard }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4">
      <h2 className="text-xl font-bold mb-3 text-center text-indigo-700">Leaderboard</h2>
      <ul className="space-y-2">
        {leaderboard
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <li 
              key={index} 
              className="flex justify-between items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                {index === 0 ? "👑" : index+1}. {player.username}
              </span>
              <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
                {player.score}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}