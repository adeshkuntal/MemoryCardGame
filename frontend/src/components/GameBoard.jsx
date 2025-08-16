import { useEffect, useState } from "react";
import { socket } from "../utils/socket";

export default function GameBoard({ username, roomId, isCreator }) {
  const [board, setBoard] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    socket.on("game-state", (room) => {
      setBoard([...room.board]);
    });

    socket.on("leaderboard", (list) => {
      setPlayers(list);
    });

    return () => {
      socket.off("game-state");
      socket.off("leaderboard");
    };
  }, []);

  const handleFlip = (cardId) => {
    socket.emit("flip-card", { roomId, cardId });
  };

  const handleStart = () => {
    socket.emit("start-match", { roomId });
  };

  const handleRestart = () => {
    socket.emit("restart-match", { roomId });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isCreator && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Match 🏁
          </button>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Restart Match 🔄
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {board.map((card) => (
          <div
            key={card.id}
            onClick={() => !card.revealed && handleFlip(card.id)}
            className="w-20 h-20 flex items-center justify-center rounded-xl cursor-pointer shadow bg-indigo-200 hover:bg-indigo-300"
          >
            {card.revealed || card.matched ? (
              <span className="text-2xl">{card.icon}</span>
            ) : (
              <span className="text-2xl">❓</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 w-full">
        <h3 className="font-bold text-lg mb-2">Leaderboard</h3>
        <ul>
          {players
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <li key={i}>
                {p.username}: {p.score}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
