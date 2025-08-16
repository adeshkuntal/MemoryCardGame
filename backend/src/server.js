import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

function generateBoard() {
  const icons = ["🍎", "🍌", "🍇", "🍉", "🍓", "🍍"];
  return [...icons, ...icons]
    .sort(() => Math.random() - 0.5)
    .map((icon, i) => ({ id: i, icon, revealed: false, matched: false }));
}

io.on("connection", (socket) => {
  socket.on("create-match", ({ username, roomId }) => {
    if (rooms[roomId]) {
      socket.emit("error-message", "Room already exists");
      return;
    }

    rooms[roomId] = {
      creator: socket.id,
      players: { [socket.id]: { username, score: 0 } },
      board: [],
      started: false,
    };

    socket.join(roomId);
    io.to(roomId).emit("game-state", rooms[roomId]);
  });

  socket.on("join-match", ({ username, roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error-message", "Room does not exist");
      return;
    }

    room.players[socket.id] = { username, score: 0 };
    socket.join(roomId);
    io.to(roomId).emit("game-state", room);
  });

  socket.on("start-match", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || socket.id !== room.creator) return;

    room.board = generateBoard();
    room.started = true;

    io.to(roomId).emit("game-state", room);
  });

  socket.on("flip-card", ({ roomId, cardId }) => {
    const room = rooms[roomId];
    if (!room || !room.started) return;

    const card = room.board.find((c) => c.id === cardId);
    if (!card || card.revealed) return;

    card.revealed = true;

    // Broadcast instantly
    io.to(roomId).emit("game-state", room);

    const revealed = room.board.filter((c) => c.revealed && !c.matched);

    if (revealed.length === 2) {
      const [c1, c2] = revealed;

      if (c1.icon === c2.icon) {
        c1.matched = c2.matched = true;
        room.players[socket.id].score += 1;
        io.to(roomId).emit("leaderboard", Object.values(room.players));
      } else {
        setTimeout(() => {
          c1.revealed = false;
          c2.revealed = false;
          io.to(roomId).emit("game-state", room);
        }, 1000);
      }
    } else {
      io.to(roomId).emit("leaderboard", Object.values(room.players));
    }
  });

  socket.on("restart-match", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || socket.id !== room.creator) return;

    room.board = generateBoard();
    Object.values(room.players).forEach((p) => (p.score = 0));
    room.started = true;

    io.to(roomId).emit("game-state", room);
    io.to(roomId).emit("leaderboard", Object.values(room.players));
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit("game-state", rooms[roomId]);
        io.to(roomId).emit("leaderboard", Object.values(rooms[roomId].players));
      }
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
