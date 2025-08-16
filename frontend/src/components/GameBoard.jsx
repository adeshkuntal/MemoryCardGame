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
      setCurrentTurn(room.turnOrder ? room.turnOrder.find(id => id === room.currentTurn) : "");
      setWinner(room.winner || null);
    });

    socket.on("leaderboard", (list) => setPlayers(list));

    return () => {
      socket.off("game-state");
      socket.off("leaderboard");
    };
  }, []);

  const handleFlip = (cardId) => socket.emit("flip-card", { roomId, cardId });
  const handleStart = () => socket.emit("start-match", { roomId });
  const handleRestart = () => socket.emit("restart-match", { roomId });

  const currentPlayerName = players.find(p => p.username && p.username === currentTurn)?.username;

  return (
    <div className="flex flex-col items-center gap-4">
      <button onClick={onHome} className="mb-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
        Home 🏠
      </button>

      {isCreator && (
        <div className="flex gap-2 mb-4">
          <button onClick={handleStart} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Start Match 🏁
          </button>
          <button onClick={handleRestart} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Restart Match 🔄
          </button>
        </div>
      )}

      {winner && (
        <div className="text-4xl font-bold text-center text-purple-600">
          🏆 {winner} Wins!
        </div>
      )}

      {!winner && currentPlayerName && (
        <div className="mb-2 text-lg font-semibold text-indigo-700">{currentPlayerName}'s Turn</div>
      )}

      <div className="grid grid-cols-4 gap-4">
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
