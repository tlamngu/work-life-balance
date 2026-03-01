import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { nanoid } from 'nanoid';
import { RoomState, Team } from '@/types';

// Let's copy the same mutative logic from server.ts to this API route.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'create_room') {
      const roomCode = nanoid(6).toUpperCase();
      store.rooms.set(roomCode, {
        roomCode,
        teams: [],
        round: null,
        winnerTeamId: null,
        createdAt: Date.now(),
        status: 'LOBBY'
      });
      return NextResponse.json({ roomCode });
    }

    const { roomCode } = payload;
    if (!roomCode) {
      return NextResponse.json({ error: 'Missing roomCode' }, { status: 400 });
    }

    const room = store.rooms.get(roomCode);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    let changed = false;

    switch (action) {
      case 'add_team': {
        const { name, slogan } = payload;
        if (room.teams.length >= 5) {
          return NextResponse.json({ success: false, error: 'Room full' });
        }
        const newTeam: Team = {
          id: nanoid(4),
          name,
          slogan,
          energy: 0,
          powerFlags: { takeBreakAvailable: false, boostAvailable: false }
        };
        room.teams.push(newTeam);
        changed = true;
        break;
      }

      case 'start_game': {
        if (room.teams.length < 2) break;
        room.status = 'PLAYING';
        startRound(room, 0);
        changed = true;
        break;
      }

      case 'submit_statements': {
        if (!room.round) break;
        const { statements, fakeIndex } = payload;
        room.round.speakerContent = { statements, fakeIndex };
        room.round.phase = 'GUESSING';
        
        const duration = 30 * 1000;
        room.round.timer = {
          phaseEndsAt: Date.now() + duration,
          duration
        };
        changed = true;

        // Note: For SSE, we simulate the auto-advance logic by checking if there's an ongoing timer
        // If we want a server-side timeout, we can set a timeout here, but since Vercel API routes 
        // are stateless and auto-kill, a simple setTimeout won't always execute cleanly on serverless.
        // For standard node environment, it handles fine. Let's replicate this.
        setTimeout(() => {
          const currentRoom = store.rooms.get(roomCode);
          if (currentRoom && currentRoom.round && currentRoom.round.phase === 'GUESSING') {
            currentRoom.round.timer = null;
            store.emitRoomUpdate(roomCode);
          }
        }, duration);

        break;
      }

      case 'cast_vote': {
        if (!room.round || room.round.phase !== 'GUESSING') break;
        const { teamId, voteIndex } = payload;
        room.round.votes[teamId] = voteIndex;
        changed = true;
        break;
      }

      case 'reveal_fake': {
        if (!room.round) break;
        room.round.phase = 'REVEAL';
        room.round.revealed = true;
        changed = true;
        break;
      }

      case 'apply_scores': {
        if (!room.round || room.round.phase !== 'REVEAL') break;
        const fakeIndex = room.round.speakerContent?.fakeIndex;
        if (fakeIndex === undefined) break;

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

        room.teams.forEach(team => {
          if (team.energy >= 3) team.powerFlags.takeBreakAvailable = true;
          if (team.energy >= 6) team.powerFlags.boostAvailable = true;
        });

        const winner = room.teams.find(t => t.energy >= 7);
        if (winner) {
          room.winnerTeamId = winner.id;
          room.status = 'ENDED';
          room.round.phase = 'GAME_OVER';
        } else {
          room.round.phase = 'SCORED';
        }

        changed = true;
        break;
      }

      case 'next_round': {
        if (!room.round) break;
        const nextRoundNum = room.round.index + 1;
        startRound(room, nextRoundNum);
        changed = true;
        break;
      }

      case 'use_boost': {
        const { sourceTeamId, targetTeamId } = payload;
        const sourceTeam = room.teams.find(t => t.id === sourceTeamId);
        const targetTeam = room.teams.find(t => t.id === targetTeamId);
        
        if (sourceTeam && targetTeam && sourceTeam.powerFlags.boostAvailable && targetTeam.energy > 0) {
          sourceTeam.energy = Math.min(7, sourceTeam.energy + 1);
          targetTeam.energy = Math.max(0, targetTeam.energy - 1);
          sourceTeam.powerFlags.boostAvailable = false;
          changed = true;
        }
        break;
      }

      case 'apply_break_penalty': {
        const { teamId } = payload;
        const team = room.teams.find(t => t.id === teamId);
        if (team && team.powerFlags.takeBreakAvailable) {
          team.energy = Math.max(0, team.energy - 1);
          team.powerFlags.takeBreakAvailable = false;
          changed = true;
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    if (changed) {
      store.emitRoomUpdate(roomCode);
    }

    return NextResponse.json({ success: true, room });

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
