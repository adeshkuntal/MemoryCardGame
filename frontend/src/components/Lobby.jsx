import { useState } from "react";
import { socket } from "../utils/socket";

export default function Lobby({ username, setUsername, roomId, setRoomId, onJoined }) {
  const [pairCount, setPairCount] = useState(8);
  const [info, setInfo] = useState("");

  const join = () => {
    if (!username || !roomId) {
      setInfo("Enter username and room ID.");
      return;
    }
    socket.emit("joinRoom", { roomId, username, pairCount }, (res) => {
      if (res?.ok) {
        onJoined();
        setInfo(`Joined room: ${roomId}`);
      } else {
        setInfo(res?.error || "Failed to join.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Multiplayer Memory Game</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          placeholder="Your username"
          className="border rounded-lg px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Room ID (e.g. room1)"
          className="border rounded-lg px-3 py-2"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={pairCount}
          onChange={(e) => setPairCount(Number(e.target.value))}
        >
          <option value={6}>Easy (6 pairs)</option>
          <option value={8}>Medium (8 pairs)</option>
          <option value={10}>Hard (10 pairs)</option>
        </select>
      </div>
      <button
        className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
        onClick={join}
      >
        Join / Create Room
      </button>
      {info && <p className="text-sm text-gray-600">{info}</p>}
      <p className="text-xs text-gray-500">
        Tip: Share the same Room ID with a friend. When 2 players are in the room, click “Start Game”.
      </p>
    </div>
  );
}
