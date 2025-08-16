import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

function generateBoard(cardCount = 12) {
  const icons = ["🍎","🍌","🍇","🍉","🍓","🍍","🥝","🍒"];
  const selected = icons.slice(0, cardCount / 2);
  return [...selected, ...selected]
    .sort(() => Math.random() - 0.5)
    .map((icon, i) => ({ id: i, icon, revealed: false, matched: false }));
}

io.on("connection", (socket) => {
  socket.on("create-match", ({ username, roomId, cardCount }) => {
    if (rooms[roomId]) {
      socket.emit("error-message", "Room already exists");
      return;
    }

    rooms[roomId] = {
      creator: socket.id,
      players: { [socket.id]: { username, score: 0 } },
      board: generateBoard(cardCount),
      started: true,
      turnOrder: [socket.id],
      currentTurn: socket.id,
      cardCount,
      winner: null
    };

    socket.join(roomId);
    io.to(roomId).emit("game-state", {
      board: rooms[roomId].board,
      players: Object.entries(rooms[roomId].players).map(([id, p]) => ({ ...p, id })),
      currentTurn: rooms[roomId].currentTurn,
      winner: rooms[roomId].winner
    });
  });

  socket.on("join-match", ({ username, roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error-message", "Room does not exist");
      return;
    }

    room.players[socket.id] = { username, score: 0 };
    room.turnOrder.push(socket.id);
    socket.join(roomId);

    io.to(roomId).emit("game-state", {
      board: room.board,
      players: Object.entries(room.players).map(([id, p]) => ({ ...p, id })),
      currentTurn: room.currentTurn,
      winner: room.winner
    });
  });

  socket.on("flip-card", ({ roomId, cardId }) => {
    const room = rooms[roomId];
    if (!room || !room.started || room.currentTurn !== socket.id) return;

    const card = room.board.find((c) => c.id === cardId);
    if (!card || card.revealed) return;

    card.revealed = true;
    io.to(roomId).emit("game-state", {
      board: room.board,
      players: Object.entries(room.players).map(([id, p]) => ({ ...p, id })),
      currentTurn: room.currentTurn,
      winner: room.winner
    });

    const revealed = room.board.filter((c) => c.revealed && !c.matched);
    if (revealed.length === 2) {
      const [c1, c2] = revealed;
      if (c1.icon === c2.icon) {
        c1.matched = c2.matched = true;
        room.players[socket.id].score += 1;
        io.to(roomId).emit("game-state", {
          board: room.board,
          players: Object.entries(room.players).map(([id, p]) => ({ ...p, id })),
          currentTurn: room.currentTurn,
          winner: room.winner
        });

        if (room.board.every((c) => c.matched)) {
          const winnerPlayer = Object.values(room.players).reduce((a, b) => a.score > b.score ? a : b);
          room.winner = winnerPlayer.username;
          io.to(roomId).emit("game-state", {
            board: room.board,
            players: Object.entries(room.players).map(([id, p]) => ({ ...p, id })),
            currentTurn: room.currentTurn,
            winner: room.winner
          });
        }
      } else {
        setTimeout(() => {
          c1.revealed = false;
          c2.revealed = false;
          // Switch turn
          const idx = room.turnOrder.indexOf(room.currentTurn);
          room.currentTurn = room.turnOrder[(idx + 1) % room.turnOrder.length];
          io.to(roomId).emit("game-state", {
            board: room.board,
            players: Object.entries(room.players).map(([id, p]) => ({ ...p, id })),
            currentTurn: room.currentTurn,
            winner: room.winner
          });
        }, 1000);
      }
    }
  });

  socket.on("restart-match", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || socket.id !== room.creator) return;

    room.board = generateBoard(room.cardCount);
    Object.values(room.players).forEach((p) => (p.score = 0));
    room.started = true;
    room.currentTurn = room.turnOrder[0];
    room.winner = null;

    io.to(roomId).emit("game-state", {
      board: room.board,
      players: Object.entries(room.players).map(([id, p]) => ({ ...p, id })),
      currentTurn: room.currentTurn,
      winner: room.winner
    });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        rooms[roomId].turnOrder = rooms[roomId].turnOrder.filter(id => id !== socket.id);
        if (rooms[roomId].turnOrder.length === 0) delete rooms[roomId];
        else {
          io.to(roomId).emit("game-state", {
            board: rooms[roomId].board,
            players: Object.entries(rooms[roomId].players).map(([id, p]) => ({ ...p, id })),
            currentTurn: rooms[roomId].currentTurn,
            winner: rooms[roomId].winner
          });
        }
      }
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
