import { useState } from "react";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";

export default function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const handleHome = () => {
    setJoined(false);
    setUsername("");
    setRoomId("");
    setIsCreator(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4 md:p-8">
      <main className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
            <GameBoard 
              username={username} 
              roomId={roomId} 
              isCreator={isCreator} 
              onHome={handleHome} 
            />
          )}
        </div>
      </main>
    </div>
  );
}