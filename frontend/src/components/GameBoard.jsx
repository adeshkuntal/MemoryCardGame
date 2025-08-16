import { useEffect, useState } from "react";
import { socket } from "../utils/socket";

export default function GameBoard({ username, roomId }) {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    socket.on("game-state", (room) => {
      setBoard([...room.board]);
    });

    return () => {
      socket.off("game-state");
    };
  }, []);

  const handleFlip = (cardId) => {
    socket.emit("flip-card", { roomId, cardId });
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center gap-4">
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
      <button
        onClick={handleRestart}
        className="mt-4 px-4 py-2 bg-red-500 rounded-xl shadow-lg hover:bg-red-600"
      >
        Restart Match 🔄
      </button>
    </div>
  );
}
