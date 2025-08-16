import { useEffect, useState } from "react";
import { socket } from "../utils/socket";

export default function GameBoard({ username, roomId, isCreator, onHome }) {
  const [board, setBoard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState("");
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    socket.on("game-state", (room) => {
      setBoard([...room.board]);
      setPlayers(room.players);
      setCurrentTurn(room.currentTurn);
      setWinner(room.winner || null);
    });

    return () => {
      socket.off("game-state");
    };
  }, []);

  const handleFlip = (cardId) => {
    if (!winner && players.find(p => p.id === currentTurn)?.username === username)
      socket.emit("flip-card", { roomId, cardId });
  };

  const handleRestart = () => {
    socket.emit("restart-match", { roomId });
  };

  const currentPlayerName = players.find(p => p.id === currentTurn)?.username;

  return (
    <div className="flex flex-col items-center gap-4">
      <button onClick={onHome} className="mb-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
        Home 🏠
      </button>

      {isCreator && !winner && (
        <button onClick={handleRestart} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-2">
          Restart Match 🔄
        </button>
      )}

      {!winner && currentPlayerName && (
        <div className="mb-2 text-lg font-semibold text-indigo-700">{currentPlayerName}'s Turn</div>
      )}

      {winner && (
        <div className="text-4xl font-bold text-center text-purple-600 mb-2">
          🏆 {winner} Wins!
        </div>
      )}

      <div className={`grid gap-4 ${board.length <= 4 ? "grid-cols-2" : board.length <= 8 ? "grid-cols-4" : "grid-cols-4"}`}>
        {board.map((card) => (
          <div
            key={card.id}
            onClick={() => !card.revealed && !winner && handleFlip(card.id)}
            className="w-20 h-20 flex items-center justify-center rounded-xl cursor-pointer shadow bg-indigo-200 hover:bg-indigo-300"
          >
            {card.revealed || card.matched ? <span className="text-2xl">{card.icon}</span> : <span className="text-2xl">❓</span>}
          </div>
        ))}
      </div>

      <div className="mt-4 w-full">
        <h3 className="font-bold text-lg mb-2">Leaderboard</h3>
        <ul>
          {players.sort((a, b) => b.score - a.score).map((p, i) => (
            <li key={i}>{p.username}: {p.score}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
