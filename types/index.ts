export type TeamId = string;
export type RoomCode = string;

export const STATEMENT_COUNT = 4;

export interface Team {
  id: TeamId;
  name: string;
  slogan: string;
  energy: number; // 0-7
  powerFlags: {
    takeBreakAvailable: boolean;
    boostAvailable: boolean;
  };
}

export type Phase = 'LOBBY' | 'SPEAKER_PREP' | 'GUESSING' | 'REVEAL' | 'SCORED' | 'GAME_OVER';

export interface SpeakerContent {
  statementCount: number;
  fakeIndex: number; // 0, 1, 2, or 3
}

export interface RoundState {
  index: number;
  speakerTeamId: TeamId;
  speakerContent: SpeakerContent | null;
  phase: Phase;
  timer: {
    phaseEndsAt: number; // Timestamp
    duration: number; // Total duration for progress bar
  } | null;
  votes: Record<TeamId, number>; // TeamId -> Index (0, 1, 2, 3)
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
