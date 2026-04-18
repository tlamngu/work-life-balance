export type TeamId = string;
export type RoomCode = string;

export const STATEMENT_COUNT = 3;

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
  fakeIndex: number; // 0, 1, or 2
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
  votes: Record<TeamId, number>; // TeamId -> Index (0, 1, 2)
  breakTargets: Record<TeamId, TeamId>; // Source team -> target team for Break
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
