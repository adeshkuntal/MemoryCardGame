import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

/**
 * In-memory structures
 * - rooms: { [roomId]: { players: [{socketId, username, pairs}], deck, revealed, matched, turnIdx, started } }
 * - leaderboard: { [username]: wins }
 */
const rooms = {};
const leaderboard = {}; // username -> wins

// Utility: create a fresh shuffled deck (pairs of symbols)
function createDeck(pairCount = 8) {
  const symbols = ["🍎","🍌","🍇","🍒","🍍","🍉","🥝","🍑","🥥","🍓","🍋","🍐","🫐","🍈","🥭","🍊","🥕","🍆"];
  const chosen = symbols.slice(0, pairCount);
  const deck = [...chosen, ...chosen]
    .map((symbol, i) => ({ id: i, symbol }))
    .sort(() => Math.random() - 0.5);
  return deck;
}

function freshRoomState(pairCount = 8) {
  const deck = createDeck(pairCount);
  return {
    players: [],                 // {socketId, username, pairs}
    deck,                        // [{id, symbol}]
    revealed: [],                // currently revealed indices (max 2)
    matched: new Set(),          // ids of matched cards
    turnIdx: 0,                  // index in players array
    started: false,
    pairCount
  };
}

function getRoomPlayerIndex(room, socketId) {
  return room.players.findIndex(p => p.socketId === socketId);
}

function broadcastState(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  io.to(roomId).emit("state", {
    players: room.players.map(p => ({ username: p.username, pairs: p.pairs })),
    turnIdx: room.turnIdx,
    revealed: room.revealed,         // send indexes for client-side view control
    matched: Array.from(room.matched),
    deckLen: room.deck.length,       // clients hold their own masked deck visuals
    started: room.started,
    pairCount: room.pairCount
  });
}

function concludeIfFinished(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  if (room.matched.size === room.deck.length) {
    // Determine winner(s)
    const maxPairs = Math.max(...room.players.map(p => p.pairs));
    const winners = room.players.filter(p => p.pairs === maxPairs);
    const winnerNames = winners.map(w => w.username);

    // Update leaderboard
    winnerNames.forEach(name => {
      leaderboard[name] = (leaderboard[name] || 0) + 1;
    });

    io.to(roomId).emit("gameOver", { winners: winnerNames });
    io.emit("leaderboard", topLeaderboard());
  }
}

function topLeaderboard(limit = 10) {
  const entries = Object.entries(leaderboard)
    .sort((a,b) => b[1] - a[1])
    .slice(0, limit)
    .map(([username, wins]) => ({ username, wins }));
  return entries;
}

// REST endpoint to read leaderboard (optional—clients also receive over socket)
app.get("/api/leaderboard", (req, res) => {
  res.json(topLeaderboard());
});

// SOCKET FLOW
io.on("connection", (socket) => {
  // Join or create a room
  socket.on("joinRoom", ({ roomId, username, pairCount = 8 }, ack) => {
    if (!roomId || !username) return ack?.({ ok: false, error: "roomId and username required" });

    if (!rooms[roomId]) rooms[roomId] = freshRoomState(pairCount);

    const room = rooms[roomId];

    // Avoid duplicate joins by same socket
    if (getRoomPlayerIndex(room, socket.id) === -1) {
      room.players.push({ socketId: socket.id, username, pairs: 0 });
    }

    socket.join(roomId);
    ack?.({ ok: true, message: "Joined", players: room.players.map(p => p.username) });

    broadcastState(roomId);
  });

  // Start game (only when 2 players are present)
  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players.length < 2) {
      io.to(roomId).emit("info", "Need at least 2 players to start.");
      return;
    }
    room.started = true;
    broadcastState(roomId);
  });

  // Player flips a card by index
  socket.on("flip", ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room || !room.started) return;
    const playerIdx = getRoomPlayerIndex(room, socket.id);
    if (playerIdx === -1) return;

    // Only current player's turn can flip
    if (playerIdx !== room.turnIdx) return;

    // Valid flip?
    const card = room.deck[index];
    if (!card) return;
    if (room.matched.has(card.id)) return;
    if (room.revealed.includes(index)) return;
    if (room.revealed.length >= 2) return;

    room.revealed.push(index);
    broadcastState(roomId);

    if (room.revealed.length === 2) {
      const [i1, i2] = room.revealed;
      const c1 = room.deck[i1];
      const c2 = room.deck[i2];

      // Delay resolution so clients can see second card
      setTimeout(() => {
        if (c1.symbol === c2.symbol) {
          // Match!
          room.matched.add(c1.id);
          room.matched.add(c2.id);
          room.players[playerIdx].pairs += 1;
          // Same player keeps the turn
          io.to(roomId).emit("match", { by: room.players[playerIdx].username, symbol: c1.symbol });
        } else {
          // Next player's turn
          room.turnIdx = (room.turnIdx + 1) % room.players.length;
          io.to(roomId).emit("noMatch", { nextPlayer: room.players[room.turnIdx].username });
        }
        room.revealed = [];
        broadcastState(roomId);
        concludeIfFinished(roomId);
      }, 750);
    }
  });

  // Restart match in the same room
  socket.on("restartMatch", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const pairCount = room.pairCount;
    const players = room.players.map(p => ({ ...p, pairs: 0 }));

    rooms[roomId] = {
      ...freshRoomState(pairCount),
      players,
      started: true // auto-start after restart
    };

    io.to(roomId).emit("restarted");
    broadcastState(roomId);
  });

  // Leave / disconnect
  socket.on("disconnect", () => {
    // Remove the player from all rooms
    for (const [roomId, room] of Object.entries(rooms)) {
      const idx = getRoomPlayerIndex(room, socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        // If empty, delete room
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          // Reset game if players < 2
          room.started = false;
          room.revealed = [];
          room.matched = new Set();
          room.turnIdx = 0;
          broadcastState(roomId);
        }
      }
    }
  });

  // Send initial leaderboard on connect
  socket.emit("leaderboard", topLeaderboard());
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
