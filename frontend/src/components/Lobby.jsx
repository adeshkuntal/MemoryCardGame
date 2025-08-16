import { useState } from "react";
import { socket } from "../utils/socket";

export default function Lobby({ username, setUsername, roomId, setRoomId, onJoined }) {
  const [error, setError] = useState("");

  const handleJoin = () => {
    if (!username || !roomId) {
      setError("Enter both username and room ID");
      return;
    }

    socket.emit("join-room", { username, roomId });
    onJoined();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Join or Create Room</h2>
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
      <button
        onClick={handleJoin}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
      >
        Join / Create Room
      </button>
    </div>
  );
}
