import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";
import { nanoid } from "nanoid";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 3000;

// Types (redefined here or imported if possible, but for simplicity in server.ts I'll define interfaces locally or use 'any' and cast, 
// but since we have type stripping, let's try to import from the file I just created if node supports it.
// Node with type stripping might not support importing .ts files without extension or configuration.
// To be safe, I will copy the interfaces or use 'any' for the server logic to avoid module resolution issues in this specific environment unless I'm sure.)
// Actually, let's try to import. If it fails, I'll fix it.
// Wait, standard Node.js with type stripping usually requires .ts extension in imports if using ESM, or standard resolution.
// Let's just define the state structure here to be safe and self-contained for the server entry point.

interface Team {
  id: string;
  name: string;
  slogan: string;
  energy: number;
  powerFlags: {
    takeBreakAvailable: boolean;
    boostAvailable: boolean;
  };
  socketId?: string;
}

interface RoundState {
  index: number;
  speakerTeamId: string;
  speakerContent: {
    statements: [string, string, string];
    fakeIndex: number;
  } | null;
  phase: 'LOBBY' | 'SPEAKER_PREP' | 'GUESSING' | 'REVEAL' | 'SCORED' | 'GAME_OVER';
  timer: {
    phaseEndsAt: number;
    duration: number;
  } | null;
  votes: Record<string, number>;
  revealed: boolean;
}

interface RoomState {
  roomCode: string;
  teams: Team[];
  round: RoundState | null;
  winnerTeamId: string | null;
  createdAt: number;
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
}

const rooms = new Map<string, RoomState>();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("create_room", (callback) => {
      const roomCode = nanoid(6).toUpperCase();
      rooms.set(roomCode, {
        roomCode,
        teams: [],
        round: null,
        winnerTeamId: null,
        createdAt: Date.now(),
        status: 'LOBBY'
      });
      socket.join(roomCode);
      if (typeof callback === 'function') callback(roomCode);
    });

    socket.on("join_room", (roomCode, callback) => {
      const room = rooms.get(roomCode);
      if (room) {
        socket.join(roomCode);
        if (typeof callback === 'function') callback(true);
        // Send current state
        socket.emit("room_state", room);
      } else {
        if (typeof callback === 'function') callback(false, "Room not found");
      }
    });

    socket.on("add_team", ({ roomCode, name, slogan }, callback) => {
      const room = rooms.get(roomCode);
      if (!room) {
        if (typeof callback === 'function') callback(false);
        return;
      }
      if (room.teams.length >= 5) {
        if (typeof callback === 'function') callback(false, "Room full");
        return;
      }

      const newTeam: Team = {
        id: nanoid(4),
        name,
        slogan,
        energy: 0,
        powerFlags: { takeBreakAvailable: false, boostAvailable: false },
        socketId: socket.id
      };
      room.teams.push(newTeam);
      io.to(roomCode).emit("room_state", room);
      if (typeof callback === 'function') callback(true);
    });

    socket.on("start_game", (roomCode) => {
      const room = rooms.get(roomCode);
      if (!room || room.teams.length < 2) return; // Need at least 2 teams

      room.status = 'PLAYING';
      startRound(room, 0);
      io.to(roomCode).emit("room_state", room);
    });

    socket.on("submit_statements", ({ roomCode, statements, fakeIndex }) => {
      const room = rooms.get(roomCode);
      if (!room || !room.round) return;

      room.round.speakerContent = { statements, fakeIndex };
      room.round.phase = 'GUESSING';
      
      // Set timer for 30 seconds
      const duration = 30 * 1000;
      room.round.timer = {
        phaseEndsAt: Date.now() + duration,
        duration
      };

      io.to(roomCode).emit("room_state", room);

      // Auto-advance after timer
      setTimeout(() => {
        if (room.round && room.round.phase === 'GUESSING') {
          // room.round.phase = 'REVEAL'; // Actually, let's wait for MC to reveal? 
          // Spec says: "Other 4 teams discuss offline for 30 seconds (timer shown)."
          // "Each guessing team votes 1/2/3 (big buttons)."
          // "MC reveals correct fake."
          // So timer is just for discussion. Voting can happen during or after?
          // Let's say voting is allowed during GUESSING.
          // When timer ends, maybe we just show "Time's up" but let MC proceed.
          // For MVP, let's just clear the timer but keep phase GUESSING until MC clicks reveal.
          room.round.timer = null;
          io.to(roomCode).emit("room_state", room);
        }
      }, duration);
    });

    socket.on("cast_vote", ({ roomCode, teamId, voteIndex }) => {
      const room = rooms.get(roomCode);
      if (!room || !room.round || room.round.phase !== 'GUESSING') return;

      room.round.votes[teamId] = voteIndex;
      io.to(roomCode).emit("room_state", room);
    });

    socket.on("reveal_fake", (roomCode) => {
      const room = rooms.get(roomCode);
      if (!room || !room.round) return;

      room.round.phase = 'REVEAL';
      room.round.revealed = true;
      io.to(roomCode).emit("room_state", room);
    });

    socket.on("apply_scores", (roomCode) => {
      const room = rooms.get(roomCode);
      if (!room || !room.round || room.round.phase !== 'REVEAL') return;

      const fakeIndex = room.round.speakerContent?.fakeIndex;
      if (fakeIndex === undefined) return;

      let fooledCount = 0;
      const guessingTeams = room.teams.filter(t => t.id !== room.round?.speakerTeamId);

      guessingTeams.forEach(team => {
        const vote = room.round?.votes[team.id];
        if (vote === fakeIndex) {
          team.energy = Math.min(7, team.energy + 1);
        } else {
          fooledCount++;
        }
      });

      if (fooledCount >= 2) {
        const speakerTeam = room.teams.find(t => t.id === room.round?.speakerTeamId);
        if (speakerTeam) {
          speakerTeam.energy = Math.min(7, speakerTeam.energy + 1);
        }
      }

      // Check milestones
      room.teams.forEach(team => {
        if (team.energy >= 3) team.powerFlags.takeBreakAvailable = true;
        if (team.energy >= 6) team.powerFlags.boostAvailable = true;
      });

      // Check win
      const winner = room.teams.find(t => t.energy >= 7);
      if (winner) {
        room.winnerTeamId = winner.id;
        room.status = 'ENDED';
        room.round.phase = 'GAME_OVER';
      } else {
        room.round.phase = 'SCORED';
      }

      io.to(roomCode).emit("room_state", room);
    });

    socket.on("next_round", (roomCode) => {
      const room = rooms.get(roomCode);
      if (!room || !room.round) return;

      const nextIndex = (room.round.index + 1) % room.teams.length;
      // Actually round index should just increment, speaker rotates
      const nextRoundNum = room.round.index + 1;
      startRound(room, nextRoundNum);
      io.to(roomCode).emit("room_state", room);
    });
    
    // Power: Energy Boost (Steal)
    socket.on("use_boost", ({ roomCode, sourceTeamId, targetTeamId }) => {
        const room = rooms.get(roomCode);
        if (!room) return;
        
        const sourceTeam = room.teams.find(t => t.id === sourceTeamId);
        const targetTeam = room.teams.find(t => t.id === targetTeamId);
        
        if (sourceTeam && targetTeam && sourceTeam.powerFlags.boostAvailable && targetTeam.energy > 0) {
            sourceTeam.energy = Math.min(7, sourceTeam.energy + 1);
            targetTeam.energy = Math.max(0, targetTeam.energy - 1);
            sourceTeam.powerFlags.boostAvailable = false; // One time use? Or available from now on? 
            // "At 6 energy: Energy Boost power becomes available." Usually implies one-time use or unlock.
            // Let's assume one-time use token for MVP simplicity, or cooldown. 
            // "Effect: choose another team -> steal 1 energy."
            // Let's consume it.
            io.to(roomCode).emit("room_state", room);
        }
    });

    socket.on("apply_break_penalty", ({ roomCode, teamId }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const team = room.teams.find(t => t.id === teamId);
      if (team && team.powerFlags.takeBreakAvailable) {
        team.energy = Math.max(0, team.energy - 1);
        team.powerFlags.takeBreakAvailable = false; // Consume power
        io.to(roomCode).emit("room_state", room);
      }
    });

  });

  function startRound(room: RoomState, roundIndex: number) {
    const speakerTeam = room.teams[roundIndex % room.teams.length];
    room.round = {
      index: roundIndex,
      speakerTeamId: speakerTeam.id,
      speakerContent: null,
      phase: 'SPEAKER_PREP',
      timer: null,
      votes: {},
      revealed: false
    };
  }

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
