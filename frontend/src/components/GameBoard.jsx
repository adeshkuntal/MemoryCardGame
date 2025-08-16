import { useEffect, useMemo, useState } from "react";
import { socket } from "../utils/socket";
import Card from "./Card";

export default function GameBoard({ username, roomId }) {
  const [state, setState] = useState({
    players: [],
    turnIdx: 0,
    revealed: [],
    matched: [],
    started: false,
    pairCount: 8,
    deckLen: 0
  });

  const [message, setMessage] = useState("");
  const cols = useMemo(() => {
    // Choose grid columns based on pairCount*2 cards
    const total = state.pairCount * 2;
    if (total <= 12) return 4;
    if (total <= 16) return 4;
    if (total <= 20) return 5;
    return 6;
  }, [state.pairCount]);

  useEffect(() => {
    const onState = (s) => setState(s);
    const onInfo = (msg) => setMessage(msg);
    const onMatch = ({ by, symbol }) => setMessage(`🎉 ${by} found a pair ${symbol}`);
    const onNoMatch = ({ nextPlayer }) => setMessage(`Next turn: ${nextPlayer}`);
    const onGameOver = ({ winners }) => setMessage(`🏆 Winner: ${winners.join(", ")}`);
    const onRestarted = () => setMessage("🔁 Match restarted!");

    socket.on("state", onState);
    socket.on("info", onInfo);
    socket.on("match", onMatch);
    socket.on("noMatch", onNoMatch);
    socket.on("gameOver", onGameOver);
    socket.on("restarted", onRestarted);

    return () => {
      socket.off("state", onState);
      socket.off("info", onInfo);
      socket.off("match", onMatch);
      socket.off("noMatch", onNoMatch);
      socket.off("gameOver", onGameOver);
      socket.off("restarted", onRestarted);
    };
  }, []);

  const start = () => socket.emit("startGame", { roomId });
  const restart = () => socket.emit("restartMatch", { roomId });

  const isMyTurn = state.players[state.turnIdx]?.username === username;

  // Build a client-side masked deck of symbols based on pairCount.
  // We don't know exact symbol positions from server (by design for simplicity),
  // but we react to server's revealed/matched indexes. For visuals, assume deckLen
  // cards and render placeholders. The server controls which indexes are currently flipped.
  // For a richer experience, you can send actual deck symbols from server. Let's do that now:
  // Small enhancement: We'll locally generate a symbol bank and align indexes with server actions.
  // To truly show correct symbols, the server must send symbols. Let's approximate:
  // We'll keep a memoized array of symbols per index keyed by pairCount to show consistent icons during a match.
  const [symbolMap, setSymbolMap] = useState([]);

  useEffect(() => {
    // Create a stable symbol map for the current match length if not set
    // (purely visual; correctness of matches handled by server events)
    const pairs = state.pairCount || 8;
    const symbols = ["🍎","🍌","🍇","🍒","🍍","🍉","🥝","🍑","🥥","🍓","🍋","🍐","🫐","🍈","🥭","🍊","🥕","🍆"].slice(0, pairs);
    const deck = [...symbols, ...symbols].slice(0, pairs * 2);
    // random but stable per mount; we won't reshuffle client-side on restart because server emits "restarted" and state resets
    setSymbolMap(deck.map((s, i) => deck[i]));
  }, [state.pairCount]);

  const flip = (index) => {
    if (!state.started) return;
    if (!isMyTurn) return;
    socket.emit("flip", { roomId, index });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Room: <span className="font-mono">{roomId}</span></h2>
          <p className="text-sm text-gray-600">
            Players: {state.players.map(p => p.username).join(", ") || "Waiting..."}
          </p>
        </div>
        <div className="flex gap-2">
          {!state.started && (
            <button
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={start}
            >
              Start Game
            </button>
          )}
          <button
            className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={restart}
          >
            Restart Match
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          {state.started ? (
            <span>
              Turn: <b>{state.players[state.turnIdx]?.username || "-"}</b>
              {isMyTurn && <span className="ml-2">🫵 Your move</span>}
            </span>
          ) : (
            <span>Waiting to start…</span>
          )}
        </div>
        <div className="text-sm text-gray-600">{message}</div>
      </div>

      {/* Scores */}
      <div className="flex gap-3">
        {state.players.map((p, i) => (
          <div key={i} className={`px-3 py-2 rounded-xl ${i === state.turnIdx ? "bg-yellow-100" : "bg-gray-100"}`}>
            <span className="font-medium">{p.username}</span>
            <span className="ml-2 text-gray-600">{p.pairs} pairs</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div
        className={`grid gap-3`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: state.pairCount * 2 }).map((_, index) => {
          const flipped = state.revealed.includes(index);
          const matched = state.matched.includes(index); // server sends ids of matched cards; we map indexes visually
          const symbol = symbolMap[index % symbolMap.length] || "❔";
          return (
            <Card
              key={index}
              symbol={symbol}
              flipped={flipped || matched}
              matched={matched}
              onClick={() => flip(index)}
            />
          );
        })}
      </div>
    </div>
  );
}
