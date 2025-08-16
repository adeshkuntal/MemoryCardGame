import { useEffect, useState } from "react";
import { socket } from "../utils/socket";
import Card from "./Card";

export default function GameBoard({ username, roomId, isCreator, onHome }) {
  const [board, setBoard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState("");
  const [winner, setWinner] = useState(null);
  const [flippedCards, setFlippedCards] = useState([]);

  useEffect(() => {
    socket.on("game-state", (room) => {
      setBoard([...room.board]);
      setPlayers(room.players);
      setCurrentTurn(room.currentTurn);
      setWinner(room.winner || null);
      // Reset flipped cards when game state updates
      setFlippedCards([]);
    });

    socket.on("card-flipped", ({ cardId }) => {
      setFlippedCards(prev => [...prev, cardId]);
    });

    return () => {
      socket.off("game-state");
      socket.off("card-flipped");
    };
  }, []);

  const handleFlip = (cardId) => {
    if (!winner && 
        players.find(p => p.id === currentTurn)?.username === username &&
        !board.find(c => c.id === cardId)?.matched &&
        flippedCards.length < 2) {
      socket.emit("flip-card", { roomId, cardId });
    }
  };
  
  const handleRestart = () => {
    socket.emit("restart-match", { roomId });
  };

  const currentPlayerName = players.find(p => p.id === currentTurn)?.username;
  const isCurrentPlayer = currentPlayerName === username;

  return (
    <div className="flex flex-col items-center p-4 md:p-6 w-full">
      <div className="flex justify-between w-full mb-4 flex-wrap gap-2">
        <button 
          onClick={onHome} 
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <span>🏠</span> Home
        </button>

        {isCreator && !winner && (
          <button 
            onClick={handleRestart} 
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Restart
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl mb-6">
        {!winner && currentPlayerName && (
          <div className={`text-center p-3 rounded-lg mb-4 ${isCurrentPlayer ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800"}`}>
            <span className="font-semibold">{isCurrentPlayer ? "Your" : `${currentPlayerName}'s`} Turn</span>
          </div>
        )}

        {winner && (
          <div className="text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-4 animate-pulse">
            <h2 className="text-2xl md:text-3xl font-bold">🏆 {winner} Wins!</h2>
          </div>
        )}
      </div>

      <div className={`grid gap-3 md:gap-4 w-full max-w-2xl ${
        board.length <= 4 ? "grid-cols-2" : 
        board.length <= 8 ? "grid-cols-3 sm:grid-cols-4" : 
        "grid-cols-4 sm:grid-cols-5 md:grid-cols-6"
      }`}>
        {board.map((card) => (
          <Card
            key={card.id}
            symbol={card.icon}
            flipped={card.revealed}
            matched={card.matched}
            onClick={() => !card.revealed && !card.matched && !winner && handleFlip(card.id)}
          />
        ))}
      </div>

      <div className="w-full max-w-2xl mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4">
        <h3 className="font-bold text-lg mb-3 text-center text-indigo-700">Leaderboard</h3>
        <ul className="space-y-2">
          {players.sort((a, b) => b.score - a.score).map((p, i) => (
            <li 
              key={i} 
              className={`flex justify-between items-center p-2 rounded-lg ${p.username === username ? "bg-indigo-100 font-medium" : "bg-gray-50"}`}
            >
              <span className="flex items-center gap-2">
                {i === 0 ? "👑" : i+1}. {p.username}
              </span>
              <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
                {p.score}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}