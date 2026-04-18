import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { Team, STATEMENT_COUNT } from '@/types';
import {
  addTeamToRoom,
  createRoom,
  isValidStatementIndex,
  mutateRoom,
  startRound,
} from '@/lib/room-service';

export const runtime = 'nodejs';

const SUPPORTED_ACTIONS = new Set([
  'create_room',
  'add_team',
  'start_game',
  'submit_fake_statement',
  'submit_statements',
  'cast_vote',
  'reveal_fake',
  'apply_scores',
  'next_round',
  'use_boost',
  'apply_break_penalty',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;
    const payload = body?.payload ?? {};

    if (!SUPPORTED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    if (action === 'create_room') {
      const room = await createRoom();
      return NextResponse.json({ roomCode: room.roomCode });
    }

    const roomCode = payload.roomCode;
    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json({ error: 'Missing roomCode' }, { status: 400 });
    }

    const room = await mutateRoom(roomCode, (currentRoom) => {
      switch (action) {
        case 'add_team': {
          const name = payload.name;
          const slogan = payload.slogan;
          const id = payload.id;

          if (typeof name !== 'string' || typeof slogan !== 'string') {
            return false;
          }

          const newTeam: Team = {
            id: typeof id === 'string' && id.length > 0 ? id : nanoid(4),
            name: name.trim(),
            slogan: slogan.trim(),
            energy: 0,
            powerFlags: { takeBreakAvailable: false, boostAvailable: false },
          };

          if (!newTeam.name || !newTeam.slogan) {
            return false;
          }

          return addTeamToRoom(currentRoom, newTeam);
        }

        case 'start_game': {
          if (currentRoom.status !== 'LOBBY' || currentRoom.teams.length < 2) {
            return false;
          }

          currentRoom.status = 'PLAYING';
          currentRoom.winnerTeamId = null;
          startRound(currentRoom, 0);
          return true;
        }

        case 'submit_fake_statement':
        case 'submit_statements': {
          if (!currentRoom.round || currentRoom.round.phase !== 'SPEAKER_PREP') {
            return false;
          }

          const fakeIndex = payload.fakeIndex;
          if (!isValidStatementIndex(fakeIndex)) {
            return false;
          }

          const duration = 30 * 1000;
          currentRoom.round.speakerContent = {
            statementCount: STATEMENT_COUNT,
            fakeIndex,
          };
          currentRoom.round.phase = 'GUESSING';
          currentRoom.round.timer = {
            phaseEndsAt: Date.now() + duration,
            duration,
          };
          currentRoom.round.revealed = false;
          currentRoom.round.votes = {};

          return true;
        }

        case 'cast_vote': {
          if (!currentRoom.round || currentRoom.round.phase !== 'GUESSING') {
            return false;
          }

          const teamId = payload.teamId;
          const voteIndex = payload.voteIndex;

          if (typeof teamId !== 'string' || !isValidStatementIndex(voteIndex)) {
            return false;
          }

          if (teamId === currentRoom.round.speakerTeamId) {
            return false;
          }

          const isKnownTeam = currentRoom.teams.some((team) => team.id === teamId);
          if (!isKnownTeam) {
            return false;
          }

          currentRoom.round.votes[teamId] = voteIndex;
          return true;
        }

        case 'reveal_fake': {
          if (!currentRoom.round || currentRoom.round.phase !== 'GUESSING' || !currentRoom.round.speakerContent) {
            return false;
          }

          currentRoom.round.phase = 'REVEAL';
          currentRoom.round.revealed = true;
          currentRoom.round.timer = null;
          return true;
        }

        case 'apply_scores': {
          if (!currentRoom.round || currentRoom.round.phase !== 'REVEAL' || !currentRoom.round.speakerContent) {
            return false;
          }

          const fakeIndex = currentRoom.round.speakerContent.fakeIndex;

          let fooledCount = 0;
          const guessingTeams = currentRoom.teams.filter(
            (team) => team.id !== currentRoom.round?.speakerTeamId,
          );

          guessingTeams.forEach((team) => {
            const vote = currentRoom.round?.votes[team.id];
            if (vote === fakeIndex) {
              team.energy = Math.min(7, team.energy + 1);
            } else {
              fooledCount += 1;
            }
          });

          if (fooledCount >= 2) {
            const speakerTeam = currentRoom.teams.find(
              (team) => team.id === currentRoom.round?.speakerTeamId,
            );

            if (speakerTeam) {
              speakerTeam.energy = Math.min(7, speakerTeam.energy + 1);
            }
          }

          currentRoom.teams.forEach((team) => {
            if (team.energy >= 3) {
              team.powerFlags.takeBreakAvailable = true;
            }
            if (team.energy >= 6) {
              team.powerFlags.boostAvailable = true;
            }
          });

          const winner = currentRoom.teams.find((team) => team.energy >= 7);
          if (winner) {
            currentRoom.winnerTeamId = winner.id;
            currentRoom.status = 'ENDED';
            currentRoom.round.phase = 'GAME_OVER';
          } else {
            currentRoom.round.phase = 'SCORED';
          }

          currentRoom.round.timer = null;
          return true;
        }

        case 'next_round': {
          if (!currentRoom.round || currentRoom.status !== 'PLAYING') {
            return false;
          }

          const nextRoundNum = currentRoom.round.index + 1;
          startRound(currentRoom, nextRoundNum);
          return true;
        }

        case 'use_boost': {
          const sourceTeamId = payload.sourceTeamId;
          const targetTeamId = payload.targetTeamId;

          if (typeof sourceTeamId !== 'string' || typeof targetTeamId !== 'string') {
            return false;
          }

          const sourceTeam = currentRoom.teams.find((team) => team.id === sourceTeamId);
          const targetTeam = currentRoom.teams.find((team) => team.id === targetTeamId);

          if (
            sourceTeam &&
            targetTeam &&
            sourceTeam.id !== targetTeam.id &&
            sourceTeam.powerFlags.boostAvailable &&
            targetTeam.energy > 0
          ) {
            sourceTeam.energy = Math.min(7, sourceTeam.energy + 1);
            targetTeam.energy = Math.max(0, targetTeam.energy - 1);
            sourceTeam.powerFlags.boostAvailable = false;
            return true;
          }

          return false;
        }

        case 'apply_break_penalty': {
          const teamId = payload.teamId;
          if (typeof teamId !== 'string') {
            return false;
          }

          const team = currentRoom.teams.find((candidate) => candidate.id === teamId);
          if (team && team.powerFlags.takeBreakAvailable) {
            team.energy = Math.max(0, team.energy - 1);
            team.powerFlags.takeBreakAvailable = false;
            return true;
          }

          return false;
        }
      }

      return false;
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
