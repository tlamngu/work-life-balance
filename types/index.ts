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
