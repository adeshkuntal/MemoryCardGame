import { useState } from "react";
import { socket } from "../utils/socket";

export default function Lobby({ username, setUsername, roomId, setRoomId, onJoined, setCreator }) {
  const [error, setError] = useState("");
  const [cardCount, setCardCount] = useState(12);

  const handleCreate = () => {
    if (!username || !roomId) return setError("Please enter both username and room ID");
    socket.emit("create-match", { username, roomId, cardCount });
    setCreator(true);
    onJoined();
  };

  const handleJoin = () => {
    if (!username || !roomId) return setError("Please enter both username and room ID");
    socket.emit("join-match", { username, roomId });
    setCreator(false);
    onJoined();
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-2">Memory Match</h2>
        <p className="text-gray-600">Start or join a memory matching game</p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded">
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
            Room ID
          </label>
          <input
            id="roomId"
            type="text"
            placeholder="Enter room code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="cardCount" className="block text-sm font-medium text-gray-700 mb-1">
            Card Count (for new matches)
          </label>
          <select 
            id="cardCount"
            value={cardCount} 
            onChange={(e) => setCardCount(Number(e.target.value))} 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={4}>4 Cards (Easy)</option>
            <option value={8}>8 Cards (Medium)</option>
            <option value={12}>12 Cards (Hard)</option>
            <option value={16}>16 Cards (Expert)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button 
          onClick={handleCreate} 
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <span>✨</span> Create New Match
        </button>
        <button 
          onClick={handleJoin} 
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <span>🔗</span> Join Match
        </button>
      </div>
    </div>
  );
}