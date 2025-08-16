export default function Leaderboard({ leaderboard }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">🏆 Leaderboard (Wins)</h2>
      {leaderboard.length === 0 ? (
        <p className="text-sm text-gray-600">No winners yet. Play a match!</p>
      ) : (
        <ul className="space-y-2">
          {leaderboard.map((entry, i) => (
            <li
              key={entry.username}
              className="flex justify-between bg-gray-50 rounded-xl px-3 py-2"
            >
              <span className="font-medium">
                {i + 1}. {entry.username}
              </span>
              <span className="text-gray-700">{entry.wins} wins</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500 mt-2">
        This is in-memory only (resets when server restarts).
      </p>
    </div>
  );
}
