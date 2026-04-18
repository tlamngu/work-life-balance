import { useEffect, useState, useRef } from 'react';
import { RoomState } from '@/types';

export const useGame = (roomCode: string) => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`/api/room/${roomCode}/events`);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const state: RoomState = JSON.parse(event.data);
          setRoomState(state);
        } catch (e) {
          console.error("Failed to parse SSE message", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        setIsConnected(false);
        // It generally auto-reconnects, but we can rely on standard EventSource reconnect
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [roomCode]);

  const postAction = async (action: string, payload: any = {}) => {
    try {
      if (!payload.roomCode && roomCode) {
        payload.roomCode = roomCode;
      }
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(`Action ${action} error:`, data.error);
      }
      return data;
    } catch (e) {
      console.error(`Action ${action} failed:`, e);
      return { error: e };
    }
  };

  const actions = {
    addTeam: (name: string, slogan: string, id?: string, callback?: (success: boolean) => void) => {
      postAction('add_team', { name, slogan, id }).then(data => {
        if (callback) callback(data && !data.error && data.success !== false);
      });
    },
    startGame: () => {
      postAction('start_game');
    },
    submitFakeStatement: (fakeIndex: number) => {
      postAction('submit_fake_statement', { fakeIndex });
    },
    castVote: (teamId: string, voteIndex: number) => {
      postAction('cast_vote', { teamId, voteIndex });
    },
    setBreakTarget: (sourceTeamId: string, targetTeamId: string) => {
      postAction('set_break_target', { sourceTeamId, targetTeamId });
    },
    revealFake: () => {
      postAction('reveal_fake');
    },
    applyScores: () => {
      postAction('apply_scores');
    },
    nextRound: () => {
      postAction('next_round');
    },
    useBoost: (sourceTeamId: string, targetTeamId: string) => {
      postAction('use_boost', { sourceTeamId, targetTeamId });
    }
  };

  return { roomState, isConnected, actions };
};
