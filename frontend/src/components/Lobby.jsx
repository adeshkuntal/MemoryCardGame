import { useState } from "react";
import { socket } from "../utils/socket";

export default function Lobby({ username, setUsername, roomId, setRoomId, onJoined, setCreator }) {
  const [error, setError] = useState("");
  const [cardCount, setCardCount] = useState(12);

  const handleCreate = () => {
    if (!username || !roomId) return setError("Enter both fields");
    socket.emit("create-match", { username, roomId, cardCount });
    setCreator(true);
    onJoined();
  };

  const handleJoin = () => {
    if (!username || !roomId) return setError("Enter both fields");
    socket.emit("join-match", { username, roomId });
    setCreator(false);
    onJoined();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Start or Join a Match</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="p-2 border rounded"
      />
      <select value={cardCount} onChange={(e) => setCardCount(Number(e.target.value))} className="p-2 border rounded">
        <option value={4}>4 Cards</option>
        <option value={8}>8 Cards</option>
        <option value={12}>12 Cards</option>
        <option value={16}>16 Cards</option>
      </select>
      <div className="flex gap-2">
        <button onClick={handleCreate} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Start New Match
        </button>
        <button onClick={handleJoin} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Join Match
        </button>
      </div>
    </div>
  );
}
