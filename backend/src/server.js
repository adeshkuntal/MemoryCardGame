import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

function generateBoard() {
  const icons = ["🍎", "🍌", "🍇", "🍉", "🍓", "🍍"];
  const pairs = [...icons, ...icons]
    .sort(() => Math.random() - 0.5)
    .map((icon, i) => ({
      id: i,
      icon,
      revealed: false,
      matched: false,
    }));
  return pairs;
}

io.on("connection", (socket) => {
  socket.on("join-room", ({ username, roomId }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: {},
        board: generateBoard(),
        turn: null,
      };
    }

    rooms[roomId].players[socket.id] = { username, score: 0 };
    if (!rooms[roomId].turn) rooms[roomId].turn = socket.id;

    socket.join(roomId);
    io.to(roomId).emit("game-state", rooms[roomId]);
  });

  socket.on("flip-card", ({ roomId, cardId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const card = room.board.find((c) => c.id === cardId);
    if (!card || card.revealed) return;

    card.revealed = true;

    const revealedCards = room.board.filter(
      (c) => c.revealed && !c.matched
    );

    if (revealedCards.length === 2) {
      const [c1, c2] = revealedCards;

      if (c1.icon === c2.icon) {
        c1.matched = c2.matched = true;
        room.players[socket.id].score += 1;
      } else {
        setTimeout(() => {
          c1.revealed = false;
          c2.revealed = false;
          io.to(roomId).emit("game-state", room);
        }, 1000);
      }
    }

    io.to(roomId).emit("game-state", room);

    const leaderboard = Object.values(room.players).map((p) => ({
      username: p.username,
      score: p.score,
    }));
    io.to(roomId).emit("leaderboard", leaderboard);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit("game-state", rooms[roomId]);
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
