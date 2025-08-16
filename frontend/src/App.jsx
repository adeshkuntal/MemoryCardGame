import { useEffect, useState } from "react";
import { socket } from "./utils/socket";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import Leaderboard from "./components/Leaderboard";

export default function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    socket.on("leaderboard", setLeaderboard);
    return () => {
      socket.off("leaderboard");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="bg-white rounded-2xl shadow p-4">
          {!joined ? (
            <Lobby
              username={username}
              setUsername={setUsername}
              roomId={roomId}
              setRoomId={setRoomId}
              onJoined={() => setJoined(true)}
              setCreator={setIsCreator}
            />
          ) : (
            <GameBoard username={username} roomId={roomId} />
          )}
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <Leaderboard leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  );
}
