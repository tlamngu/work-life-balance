import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState } from '@/types';

export const useGame = (roomCode: string) => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    // Initialize socket
    const socketInstance = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });
    socketRef.current = socketInstance;
    // eslint-disable-next-line
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket');
      socketInstance.emit('join_room', roomCode, (success: boolean) => {
        if (!success) console.error("Failed to join room");
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket');
    });

    socketInstance.on('room_state', (state: RoomState) => {
      console.log('Received room state:', state);
      setRoomState(state);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [roomCode]);

  const actions = {
    addTeam: (name: string, slogan: string, callback?: (success: boolean) => void) => {
      socketRef.current?.emit('add_team', { roomCode, name, slogan }, callback);
    },
    startGame: () => {
      socketRef.current?.emit('start_game', roomCode);
    },
    submitStatements: (statements: [string, string, string], fakeIndex: number) => {
      socketRef.current?.emit('submit_statements', { roomCode, statements, fakeIndex });
    },
    castVote: (teamId: string, voteIndex: number) => {
      socketRef.current?.emit('cast_vote', { roomCode, teamId, voteIndex });
    },
    revealFake: () => {
      socketRef.current?.emit('reveal_fake', roomCode);
    },
    applyScores: () => {
      socketRef.current?.emit('apply_scores', roomCode);
    },
    nextRound: () => {
      socketRef.current?.emit('next_round', roomCode);
    },
    useBoost: (sourceTeamId: string, targetTeamId: string) => {
      socketRef.current?.emit('use_boost', { roomCode, sourceTeamId, targetTeamId });
    },
    applyBreakPenalty: (teamId: string) => {
      socketRef.current?.emit('apply_break_penalty', { roomCode, teamId });
    }
  };

  return { roomState, isConnected, actions, socket };
};
