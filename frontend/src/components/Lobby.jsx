import { useState } from "react";
import { socket } from "../utils/socket";

export default function Lobby({ username, setUsername, roomId, setRoomId, onJoined, setCreator }) {
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!username || !roomId) return setError("Enter both fields");
    socket.emit("create-match", { username, roomId });
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
      <div className="flex gap-2">
        <button onClick={handleCreate} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Start New Match</button>
        <button onClick={handleJoin} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Join Match</button>
      </div>
    </div>
  );
}
