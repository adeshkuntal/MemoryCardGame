export default function Leaderboard({ leaderboard }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Leaderboard</h2>
      <ul>
        {leaderboard
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <li key={index} className="mb-1">
              {player.username}: {player.score}
            </li>
          ))}
      </ul>
    </div>
  );
}
