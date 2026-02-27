export type TeamId = string;
export type RoomCode = string;

export interface Team {
  id: TeamId;
  name: string;
  slogan: string;
  energy: number; // 0-7
  powerFlags: {
    takeBreakAvailable: boolean;
    boostAvailable: boolean;
  };
  socketId?: string;
}

export type Phase = 'LOBBY' | 'SPEAKER_PREP' | 'GUESSING' | 'REVEAL' | 'SCORED' | 'GAME_OVER';

export interface RoundState {
  index: number;
  speakerTeamId: TeamId;
  speakerContent: {
    statements: [string, string, string];
    fakeIndex: number; // 0, 1, or 2
  } | null;
  phase: Phase;
  timer: {
    phaseEndsAt: number; // Timestamp
    duration: number; // Total duration for progress bar
  } | null;
  votes: Record<TeamId, number>; // TeamId -> Index (0, 1, 2)
  revealed: boolean;
}

export interface RoomState {
  roomCode: RoomCode;
  teams: Team[];
  round: RoundState | null;
  winnerTeamId: TeamId | null;
  createdAt: number;
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
}

// Events
export interface ServerToClientEvents {
  room_state: (state: RoomState) => void;
  error: (message: string) => void;
  timer_sync: (timer: { phaseEndsAt: number; duration: number } | null) => void;
}

export interface ClientToServerEvents {
  create_room: (callback: (roomCode: string) => void) => void;
  join_room: (roomCode: string, callback: (success: boolean, msg?: string) => void) => void;
  add_team: (roomCode: string, team: { name: string; slogan: string }, callback: (success: boolean) => void) => void;
  start_game: (roomCode: string) => void;
  submit_statements: (roomCode: string, statements: [string, string, string], fakeIndex: number) => void;
  cast_vote: (roomCode: string, teamId: string, voteIndex: number) => void;
  reveal_fake: (roomCode: string) => void;
  next_round: (roomCode: string) => void;
  use_power: (roomCode: string, powerType: 'TAKE_BREAK' | 'BOOST', payload: any) => void;
  use_boost: (payload: { roomCode: string; sourceTeamId: string; targetTeamId: string }) => void;
  apply_break_penalty: (payload: { roomCode: string; teamId: string }) => void;
}
