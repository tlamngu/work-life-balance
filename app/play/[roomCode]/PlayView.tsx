'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { STATEMENT_COUNT } from '@/types';
import { LuCheck, LuX, LuZap } from 'react-icons/lu';

const statementIndexes = Array.from({ length: STATEMENT_COUNT }, (_, index) => index);

export default function PlayView({ roomCode }: { roomCode: string }) {
  const { roomState, isConnected, actions } = useGame(roomCode);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);

  // Speaker Selection State
  const [selectedFakeChoice, setSelectedFakeChoice] = useState<{ roundIndex: number; fakeIndex: number } | null>(null);
  const [selectedBreakChoice, setSelectedBreakChoice] = useState<{ roundIndex: number; teamId: string } | null>(null);
  const [selectedBoostChoice, setSelectedBoostChoice] = useState<{ roundIndex: number; teamId: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`energy_bar_team_${roomCode}`);
    if (!stored) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setMyTeamId(stored);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [roomCode]);

  const joinTeam = (teamId: string) => {
    setMyTeamId(teamId);
    localStorage.setItem(`energy_bar_team_${roomCode}`, teamId);
  };

  const createAndJoinTeam = (name: string, slogan: string) => {
    const newId = Math.random().toString(36).substring(2, 9);
    actions.addTeam(name, slogan, newId);
    joinTeam(newId);
  };

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlogan, setNewTeamSlogan] = useState('');

  if (!isConnected || !roomState) return <div className="flex h-screen items-center justify-center p-6 text-orange-950 font-pixel-header text-xl animate-pulse">CONNECTING...</div>;

  const { teams, round, status } = roomState;
  const currentRoundIndex = round?.index ?? -1;
  const selectedFakeIndex = selectedFakeChoice && selectedFakeChoice.roundIndex === currentRoundIndex
    ? selectedFakeChoice.fakeIndex
    : null;
  const selectedBreakTargetId = selectedBreakChoice && selectedBreakChoice.roundIndex === currentRoundIndex
    ? selectedBreakChoice.teamId
    : '';
  const selectedBoostTargetId = selectedBoostChoice && selectedBoostChoice.roundIndex === currentRoundIndex
    ? selectedBoostChoice.teamId
    : '';

  const myTeam = teams.find(t => t.id === myTeamId);

  // 1. Team Selection
  if (!myTeam) {
    return (
      <div className="min-h-screen p-6 text-orange-950 flex flex-col items-center justify-start pt-12 overflow-y-auto">
        <h1 className="mb-6 text-2xl font-pixel-header text-orange-600 text-center">JOIN OR CREATE TEAM</h1>
        <div className="flex flex-col w-full max-w-md gap-8 pb-12">
          
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="mb-4 text-xl font-pixel-header">CREATE NEW TEAM</h2>
            <div className="space-y-4">
              <input
                className="w-full bg-orange-50 p-3 text-black placeholder:text-orange-300 border-4 border-black font-pixel-body text-xl focus:outline-none focus:bg-white"
                placeholder="TEAM NAME"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
              />
              <input
                className="w-full bg-orange-50 p-3 text-black placeholder:text-orange-300 border-4 border-black font-pixel-body text-xl focus:outline-none focus:bg-white"
                placeholder="SLOGAN"
                value={newTeamSlogan}
                onChange={e => setNewTeamSlogan(e.target.value)}
              />
              <button
                onClick={() => {
                  if (newTeamName && newTeamSlogan) createAndJoinTeam(newTeamName, newTeamSlogan);
                }}
                className="w-full bg-indigo-500 p-3 font-pixel-header text-white border-4 border-black hover:bg-indigo-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
              >
                CREATE & JOIN
              </button>
            </div>
          </div>

          <div>
             <h2 className="mb-4 text-xl font-pixel-header text-center">OR SELECT EXISTING TEAM</h2>
             <div className="grid gap-4">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => joinTeam(team.id)}
                    className="group relative bg-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-pixel-header text-black">{team.name}</span>
                      <span className="text-lg font-pixel-body text-orange-800 break-words ml-2">&quot;{team.slogan}&quot;</span>
                    </div>
                  </button>
                ))}
                {teams.length === 0 && <div className="text-center text-orange-400 font-pixel-body text-lg italic mt-4">NO EXISTING TEAMS YET...</div>}
             </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Lobby Waiting
  if (status === 'LOBBY') {
    return (
      <div className="min-h-screen p-6 text-orange-950 flex flex-col items-center justify-center text-center">
        <div className="mb-8 h-24 w-24 bg-orange-200 border-4 border-black flex items-center justify-center mx-auto animate-bounce shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
           <LuZap className="h-12 w-12 text-orange-600" />
        </div>
        <h1 className="text-4xl font-pixel-header mb-4 text-black">{myTeam.name}</h1>
        <p className="text-xl text-orange-800 mb-8 font-pixel-body">WAITING FOR GAME TO START...</p>
        <div className="px-4 py-2 bg-white border-4 border-black font-pixel-header text-sm text-orange-500">
          ROOM: {roomCode}
        </div>
      </div>
    );
  }

  if (status === 'ENDED') {
    const winnerTeam = teams.find((team) => team.id === roomState.winnerTeamId);

    return (
      <div className="min-h-screen p-6 text-orange-950 flex flex-col items-center justify-center text-center">
        <div className="h-28 w-28 bg-yellow-300 border-4 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
          <LuZap className="h-14 w-14 text-orange-700" />
        </div>
        <h1 className="text-4xl font-pixel-header text-black mb-3">GAME COMPLETE</h1>
        <p className="text-2xl font-pixel-body text-orange-800 mb-8">
          {winnerTeam ? `${winnerTeam.name} WON THE MATCH!` : 'A WINNER HAS BEEN DECIDED!'}
        </p>

        <div className="w-full max-w-lg bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-pixel-header text-orange-600 mb-2">WAITING FOR MC</p>
          <p className="font-pixel-body text-lg text-black">
            The MC can restart this room or end the session.
          </p>
        </div>
      </div>
    );
  }

  // 3. Game Loop
  if (!round) return <div className="min-h-screen p-6 text-orange-950 flex items-center justify-center font-pixel-header">LOADING ROUND...</div>;

  const renderTeamPowers = () => {
    const roundBreakTargets = round.breakTargets ?? {};
    const lockedBreakTargetId = roundBreakTargets[myTeam.id];
    const lockedBreakTeam = teams.find((team) => team.id === lockedBreakTargetId);
    const nextSpeakerTeamId = teams[(round.index + 1) % teams.length]?.id;
    const canLockBreakNow = round.phase === 'SPEAKER_PREP' || round.phase === 'GUESSING';

    const breakTargetCandidates = teams.filter(
      (team) => team.id !== myTeam.id && team.id !== nextSpeakerTeamId,
    );
    const boostTargetCandidates = teams.filter((team) => team.id !== myTeam.id);
    const selectedBoostTeam = boostTargetCandidates.find((team) => team.id === selectedBoostTargetId);

    return (
      <section className="mt-8 w-full max-w-2xl mx-auto bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left">
        <h3 className="text-xl font-pixel-header text-black mb-2">TEAM POWERS</h3>
        <p className="text-sm font-pixel-body text-orange-700 mb-4">
          BREAK applies only if your chosen target voted wrong. You cannot target the next-round speaker.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-4 border-black bg-blue-50 p-4">
            <div className="text-sm font-pixel-header text-blue-700 mb-2">BREAK (UNLOCK: 3 ENERGY)</div>

            {lockedBreakTeam ? (
              <div className="font-pixel-body text-lg text-blue-900">
                TARGET LOCKED: {lockedBreakTeam.name}
              </div>
            ) : myTeam.powerFlags.takeBreakAvailable ? (
              <>
                <select
                  value={selectedBreakTargetId}
                  onChange={(event) => {
                    setSelectedBreakChoice({ roundIndex: round.index, teamId: event.target.value });
                  }}
                  className="w-full bg-white border-4 border-black p-2 font-pixel-body text-lg focus:outline-none"
                >
                  <option value="">SELECT TEAM</option>
                  {breakTargetCandidates.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                <button
                  disabled={
                    !canLockBreakNow ||
                    !selectedBreakTargetId ||
                    breakTargetCandidates.length === 0
                  }
                  onClick={() => {
                    if (!selectedBreakTargetId) {
                      return;
                    }
                    setSelectedBreakChoice(null);
                    actions.setBreakTarget(myTeam.id, selectedBreakTargetId);
                  }}
                  className="mt-3 w-full border-4 border-black bg-blue-300 p-2 font-pixel-header text-black hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  LOCK BREAK TARGET
                </button>

                {!canLockBreakNow && (
                  <p className="mt-2 text-xs font-pixel-body text-blue-700">BREAK TARGETING IS OPEN DURING PREP OR GUESSING.</p>
                )}
                {breakTargetCandidates.length === 0 && (
                  <p className="mt-2 text-xs font-pixel-body text-blue-700">NO VALID TARGET THIS ROUND. YOU NEED 3+ TEAMS FOR THIS RULE.</p>
                )}
              </>
            ) : (
              <div className="font-pixel-body text-sm text-blue-700">UNAVAILABLE (NEED 3 ENERGY)</div>
            )}
          </div>

          <div className="border-4 border-black bg-yellow-50 p-4">
            <div className="text-sm font-pixel-header text-yellow-700 mb-2">BOOST (UNLOCK: 5 ENERGY)</div>

            {myTeam.powerFlags.boostAvailable ? (
              <>
                <select
                  value={selectedBoostTargetId}
                  onChange={(event) => {
                    setSelectedBoostChoice({ roundIndex: round.index, teamId: event.target.value });
                  }}
                  className="w-full bg-white border-4 border-black p-2 font-pixel-body text-lg focus:outline-none"
                >
                  <option value="">SELECT TEAM</option>
                  {boostTargetCandidates.map((team) => (
                    <option key={team.id} value={team.id} disabled={team.energy <= 0}>
                      {team.name} ({team.energy})
                    </option>
                  ))}
                </select>

                <button
                  disabled={!selectedBoostTeam || selectedBoostTeam.energy <= 0}
                  onClick={() => {
                    if (!selectedBoostTeam || selectedBoostTeam.energy <= 0) {
                      return;
                    }
                    setSelectedBoostChoice(null);
                    actions.useBoost(myTeam.id, selectedBoostTeam.id);
                  }}
                  className="mt-3 w-full border-4 border-black bg-yellow-300 p-2 font-pixel-header text-black hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  STEAL 1 ENERGY
                </button>
              </>
            ) : (
              <div className="font-pixel-body text-sm text-yellow-700">UNAVAILABLE (NEED 5 ENERGY)</div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const isSpeaker = round.speakerTeamId === myTeamId;

  // SPEAKER VIEW
  if (isSpeaker) {
    if (round.phase === 'SPEAKER_PREP') {
      return (
        <div className="min-h-screen p-6 text-orange-950">
          <header className="mb-6 text-center">
            <h2 className="text-lg font-pixel-header text-orange-600 mb-2">YOU ARE THE SPEAKER</h2>
            <p className="text-orange-800 text-lg font-pixel-body">
              Speak {STATEMENT_COUNT} statements out loud in the real world.<br />
              Pick which statement number is fake, then submit.
            </p>
          </header>

          <div className="space-y-6 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
              {statementIndexes.map((index) => {
                const isSelected = selectedFakeIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedFakeChoice({ roundIndex: round.index, fakeIndex: index })}
                    className={`h-24 border-4 font-pixel-header text-3xl transition-all ${
                      isSelected
                        ? 'bg-red-500 text-white border-black -translate-y-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black border-black hover:bg-orange-100 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    #{index + 1}
                  </button>
                );
              })}
            </div>
            
            <button
              disabled={selectedFakeIndex === null}
              onClick={() => {
                if (selectedFakeIndex !== null) {
                  setSelectedFakeChoice(null);
                  actions.submitFakeStatement(selectedFakeIndex);
                }
              }}
              className="w-full h-16 bg-yellow-400 text-xl font-pixel-header text-black border-4 border-black hover:bg-yellow-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              SUBMIT FAKE CHOICE
            </button>
            <p className="text-center text-sm text-orange-600 font-pixel-body mt-4">
              TIP: KEEP A POKER FACE! DON&apos;T LET THEM GUESS.
            </p>
          </div>

          {renderTeamPowers()}
        </div>
      );
    }
    
    return (
      <div className="min-h-screen p-6 text-orange-950 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-pixel-header mb-6">READ THEM OUT LOUD!</h1>
        <div className="space-y-4 w-full max-w-md text-left">
          {statementIndexes.map((index) => {
            const isFake = round.speakerContent?.fakeIndex === index;
            return (
              <div key={index} className={`p-4 bg-white border-4 ${isFake ? 'border-red-500' : 'border-black'}`}>
                <span className="font-pixel-header font-bold mr-3 text-orange-500">#{index + 1}</span>
                <span className="font-pixel-body text-xl">STATEMENT #{index + 1}</span>
                {isFake && <span className="ml-2 text-xs text-red-500 font-pixel-header">[FAKE]</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-8 p-4 bg-orange-100 border-4 border-black text-orange-800 font-pixel-body text-lg">
          WAIT FOR TEAMS TO VOTE...
        </div>

        {renderTeamPowers()}
      </div>
    );
  }

  // GUESSER VIEW
  if (round.phase === 'SPEAKER_PREP') {
    return (
      <div className="min-h-screen p-6 text-orange-950 flex flex-col items-center justify-center text-center">
        <div className="animate-bounce mb-4 text-6xl">🤫</div>
        <h2 className="text-2xl font-pixel-header mb-2">SPEAKER IS PREPARING...</h2>
        <p className="text-orange-800 font-pixel-body text-xl">GET READY TO LISTEN CAREFULLY!</p>
      </div>
    );
  }

  if (round.phase === 'GUESSING') {
    const hasVoted = round.votes[myTeam.id] !== undefined;
    
    return (
      <div className="min-h-screen p-6 text-orange-950 flex flex-col">
        <header className="mb-8 text-center">
          <h2 className="text-lg font-pixel-header text-orange-600 mb-2">GUESS THE FAKE</h2>
          <div className="text-4xl font-pixel-header text-black">
             {/* Timer could go here */}
             {round.timer ? '⏳ TIME LEFT' : 'VOTE NOW'}
          </div>
        </header>

        {hasVoted ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="h-32 w-32 bg-green-500 border-4 border-black flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <LuCheck className="h-16 w-16 text-black" />
            </div>
            <h3 className="text-2xl font-pixel-header text-green-600">VOTE SENT!</h3>
            <p className="text-orange-800 mt-2 font-pixel-body text-xl">WAITING FOR REVEAL...</p>
          </div>
        ) : (
          <div className="flex-1 grid gap-4 max-w-md mx-auto w-full">
            {statementIndexes.map((index) => (
              <button
                key={index}
                onClick={() => actions.castVote(myTeam.id, index)}
                className="p-4 bg-white border-4 border-black font-pixel-body text-xl hover:bg-indigo-500 hover:text-white hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-start text-left gap-4"
              >
                <span className="text-3xl font-pixel-header text-orange-500 min-w-[2rem] text-center">#{index + 1}</span>
                <span>STATEMENT #{index + 1}</span>
              </button>
            ))}
          </div>
        )}

        {renderTeamPowers()}
      </div>
    );
  }

  if (round.phase === 'REVEAL' || round.phase === 'SCORED') {
    const myVote = round.votes[myTeam.id];
    const correctFake = round.speakerContent?.fakeIndex;
    const hasVoted = myVote !== undefined;
    const isCorrect = hasVoted && myVote === correctFake;

    return (
      <div className="min-h-screen p-6 text-orange-950 flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          {isCorrect ? (
            <div className="h-32 w-32 bg-green-500 border-4 border-black flex items-center justify-center mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <LuCheck className="h-16 w-16 text-black" />
            </div>
          ) : (
            <div className="h-32 w-32 bg-red-500 border-4 border-black flex items-center justify-center mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <LuX className="h-16 w-16 text-white" />
            </div>
          )}
        </div>
        
        <h2 className="text-4xl font-pixel-header mb-4 text-black">
          {!hasVoted ? 'NO VOTE' : isCorrect ? 'CORRECT!' : 'WRONG!'}
        </h2>
        <p className="text-2xl text-orange-800 mb-8 font-pixel-body">
          THE FAKE WAS STATEMENT #{correctFake !== undefined ? correctFake + 1 : '?'}
        </p>

        <div className="p-6 bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
           <div className="text-sm text-orange-500 font-pixel-header mb-2">CURRENT ENERGY</div>
           <div className="text-6xl font-pixel-header text-yellow-500 drop-shadow-md">{myTeam.energy}/7</div>
        </div>

        {renderTeamPowers()}
      </div>
    );
  }

  return <div className="min-h-screen p-6 text-orange-950 flex items-center justify-center font-pixel-header">WAITING...</div>;
}
