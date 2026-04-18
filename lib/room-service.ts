import { customAlphabet } from 'nanoid';
import { Collection, MongoServerError, WithId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { RoomState, STATEMENT_COUNT, Team } from '@/types';

const ROOM_COLLECTION = 'rooms';
const ROOM_CODE_LENGTH = 6;
const MAX_UPDATE_RETRIES = 8;

const SPEAKER_PREP_DURATION_MS = 90 * 1000;
const GUESSING_DURATION_MS = 30 * 1000;

const makeRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', ROOM_CODE_LENGTH);

interface RoomDocument extends RoomState {
  version: number;
  updatedAt: number;
}

let indexesReady = false;

async function getRoomsCollection(): Promise<Collection<RoomDocument>> {
  const db = await getMongoDb();
  const collection = db.collection<RoomDocument>(ROOM_COLLECTION);

  if (!indexesReady) {
    await Promise.all([
      collection.createIndex({ roomCode: 1 }, { unique: true }),
      collection.createIndex({ updatedAt: 1 }),
    ]);
    indexesReady = true;
  }

  return collection;
}

function cloneRoomFromDoc(doc: WithId<RoomDocument>): RoomState {
  const breakTargets = doc.round?.breakTargets ?? {};

  return {
    roomCode: doc.roomCode,
    teams: doc.teams.map((team) => ({
      ...team,
      powerFlags: { ...team.powerFlags },
    })),
    round: doc.round
      ? {
          ...doc.round,
          speakerContent: doc.round.speakerContent
            ? {
                ...doc.round.speakerContent,
              }
            : null,
          timer: doc.round.timer
            ? {
                ...doc.round.timer,
              }
            : null,
          votes: { ...doc.round.votes },
          breakTargets: { ...breakTargets },
        }
      : null,
    winnerTeamId: doc.winnerTeamId,
    createdAt: doc.createdAt,
    status: doc.status,
  };
}

function randomFakeIndex(): number {
  return Math.floor(Math.random() * STATEMENT_COUNT);
}

export function isValidStatementIndex(index: unknown): index is number {
  return Number.isInteger(index) && Number(index) >= 0 && Number(index) < STATEMENT_COUNT;
}

export function startRound(room: RoomState, roundIndex: number) {
  const speakerTeam = room.teams[roundIndex % room.teams.length];

  room.round = {
    index: roundIndex,
    speakerTeamId: speakerTeam.id,
    speakerContent: null,
    phase: 'SPEAKER_PREP',
    timer: {
      phaseEndsAt: Date.now() + SPEAKER_PREP_DURATION_MS,
      duration: SPEAKER_PREP_DURATION_MS,
    },
    votes: {},
    breakTargets: {},
    revealed: false,
  };
}

export function advanceRoomByTime(room: RoomState, now = Date.now()): boolean {
  if (!room.round || room.status !== 'PLAYING') {
    return false;
  }

  let changed = false;

  if (room.round.phase === 'SPEAKER_PREP' && room.round.timer && now >= room.round.timer.phaseEndsAt) {
    room.round.speakerContent = {
      statementCount: STATEMENT_COUNT,
      fakeIndex: randomFakeIndex(),
    };
    room.round.phase = 'GUESSING';
    room.round.timer = {
      phaseEndsAt: now + GUESSING_DURATION_MS,
      duration: GUESSING_DURATION_MS,
    };
    changed = true;
  }

  if (room.round.phase === 'GUESSING' && room.round.timer && now >= room.round.timer.phaseEndsAt) {
    room.round.timer = null;
    changed = true;
  }

  return changed;
}

export async function createRoom(): Promise<RoomState> {
  const collection = await getRoomsCollection();
  const now = Date.now();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomCode = makeRoomCode();

    const room: RoomDocument = {
      roomCode,
      teams: [],
      round: null,
      winnerTeamId: null,
      createdAt: now,
      status: 'LOBBY',
      version: 1,
      updatedAt: now,
    };

    try {
      await collection.insertOne(room);
      return {
        roomCode: room.roomCode,
        teams: room.teams,
        round: room.round,
        winnerTeamId: room.winnerTeamId,
        createdAt: room.createdAt,
        status: room.status,
      };
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate a unique room code.');
}

type RoomMutator = (room: RoomState) => boolean;

export async function mutateRoom(roomCode: string, mutator: RoomMutator): Promise<RoomState | null> {
  const collection = await getRoomsCollection();

  for (let attempt = 0; attempt < MAX_UPDATE_RETRIES; attempt += 1) {
    const doc = await collection.findOne({ roomCode });
    if (!doc) {
      return null;
    }

    const room = cloneRoomFromDoc(doc);
    let changed = advanceRoomByTime(room);

    changed = mutator(room) || changed;

    if (!changed) {
      return room;
    }

    const replacement: RoomDocument = {
      ...room,
      version: doc.version + 1,
      updatedAt: Date.now(),
    };

    const result = await collection.replaceOne(
      { _id: doc._id, version: doc.version },
      replacement,
    );

    if (result.modifiedCount === 1) {
      return room;
    }
  }

  throw new Error(`Room update conflict for ${roomCode}. Please retry.`);
}

export async function getRoomState(roomCode: string): Promise<RoomState | null> {
  return mutateRoom(roomCode, () => false);
}

export function addTeamToRoom(room: RoomState, team: Team): boolean {
  if (room.status !== 'LOBBY') {
    return false;
  }

  const exists = room.teams.some((existingTeam) => existingTeam.id === team.id);
  if (exists) {
    return false;
  }

  room.teams.push(team);
  return true;
}
