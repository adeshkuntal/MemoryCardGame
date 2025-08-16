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
  const icons = ["🍎", "🍌", "🍇", "🍉", "🍓", "🍍", "🥝", "🍒"];
  const pairsNeeded = Math.floor(cardCount / 2);
  const selected = icons.slice(0, pairsNeeded);
  const pairs = [...selected, ...selected];
  
  return pairs
    .sort(() => Math.random() - 0.5)
    .map((icon, i) => ({ 
      id: i, 
      icon, 
      revealed: false, 
      matched: false 
    }));
}

io.on("connection", (socket) => {
  socket.on("create-match", ({ username, roomId, cardCount }) => {
    if (rooms[roomId]) {
      socket.emit("error-message", "Room already exists");
      return;
    }

    // Validate card count (must be even and within range)
    const validCardCount = Math.max(4, Math.min(16, Math.floor(cardCount / 2) * 2));

    rooms[roomId] = {
      creator: socket.id,
      players: { [socket.id]: { username, score: 0 } },
      board: generateBoard(validCardCount),
      started: true,
      turnOrder: [socket.id],
      currentTurn: socket.id,
      cardCount: validCardCount,
      winner: null,
      lastFlipped: null
    };

    socket.join(roomId);
    emitGameState(roomId);
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

    emitGameState(roomId);
  });

  socket.on("flip-card", ({ roomId, cardId }) => {
    const room = rooms[roomId];
    if (!room || !room.started || room.currentTurn !== socket.id) return;

    const card = room.board.find((c) => c.id === cardId);
    if (!card || card.revealed || card.matched) return;

    // Flip the card
    card.revealed = true;
    emitGameState(roomId);

    // Check for match logic
    const revealedCards = room.board.filter((c) => c.revealed && !c.matched);
    
    if (revealedCards.length === 2) {
      const [firstCard, secondCard] = revealedCards;
      
      if (firstCard.icon === secondCard.icon) {
        // Match found
        firstCard.matched = true;
        secondCard.matched = true;
        room.players[socket.id].score += 1;
        
        // Check for game completion
        if (room.board.every((c) => c.matched)) {
          const winner = getWinner(room.players);
          room.winner = winner;
          room.started = false;
        }
        
        emitGameState(roomId);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          firstCard.revealed = false;
          secondCard.revealed = false;
          nextTurn(room);
          emitGameState(roomId);
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
    room.lastFlipped = null;

    emitGameState(roomId);
  });

  socket.on("disconnect", () => {
    handleDisconnect(socket.id);
  });

  // Helper functions
  function emitGameState(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    io.to(roomId).emit("game-state", {
      board: room.board,
      players: Object.entries(room.players).map(([id, p]) => ({ ...p, id })),
      currentTurn: room.currentTurn,
      winner: room.winner
    });
  }

  function nextTurn(room) {
    const currentIndex = room.turnOrder.indexOf(room.currentTurn);
    const nextIndex = (currentIndex + 1) % room.turnOrder.length;
    room.currentTurn = room.turnOrder[nextIndex];
  }

  function getWinner(players) {
    const playerArray = Object.values(players);
    const maxScore = Math.max(...playerArray.map(p => p.score));
    const winners = playerArray.filter(p => p.score === maxScore);
    return winners.length === 1 ? winners[0].username : "It's a tie!";
  }

  function handleDisconnect(socketId) {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socketId]) {
        delete room.players[socketId];
        room.turnOrder = room.turnOrder.filter(id => id !== socketId);
        
        if (room.turnOrder.length === 0) {
          delete rooms[roomId];
        } else {
          // If disconnected player was current turn, move to next player
          if (room.currentTurn === socketId) {
            room.currentTurn = room.turnOrder[0];
          }
          emitGameState(roomId);
        }
      }
    }
  }
});

server.listen(5000, () => console.log("Server running on port 5000"));