'use client';

import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { LuUsers, LuPlay, LuEye, LuArrowRight, LuZap, LuCoffee, LuQrCode, LuX } from 'react-icons/lu';
import QRCode from 'react-qr-code';

export default function MCView({ roomCode }: { roomCode: string }) {
  const { roomState, isConnected, actions } = useGame(roomCode);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlogan, setNewTeamSlogan] = useState('');
  const [showQR, setShowQR] = useState(false);

  if (!isConnected) return <div className="p-8 text-orange-950 font-pixel-body text-xl">CONNECTING...</div>;
  if (!roomState) return <div className="p-8 text-orange-950 font-pixel-body text-xl">LOADING ROOM...</div>;

  const { teams, status, round } = roomState;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${roomCode}` : '';

  if (status === 'LOBBY') {
    return (
      <div className="min-h-screen p-6 text-orange-950 font-pixel-body relative">
        {/* QR Modal */}
        {showQR && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)] max-w-sm w-full text-center relative">
              <button 
                onClick={() => setShowQR(false)}
                className="absolute -top-4 -right-4 bg-red-500 text-white p-2 border-4 border-black hover:bg-red-600 transition-colors"
              >
                <LuX size={24} />
              </button>
              <h2 className="text-2xl font-pixel-header mb-6">SCAN TO JOIN</h2>
              <div className="bg-white p-4 border-4 border-black inline-block mb-4">
                <QRCode value={joinUrl} size={200} />
              </div>
              <div className="text-3xl font-pixel-header tracking-widest bg-orange-100 p-2 border-2 border-black">
                {roomCode}
              </div>
            </div>
          </div>
        )}

        <header className="mb-8 flex items-center justify-between border-b-4 border-black pb-4 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <h1 className="text-2xl font-pixel-header text-orange-600">MC PANEL</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">ROOM CODE:</span>
                <span className="text-3xl font-pixel-header text-black">{roomCode}</span>
              </div>
              <button 
                onClick={() => setShowQR(true)}
                className="bg-black text-white p-2 hover:bg-gray-800 transition-colors border-2 border-transparent hover:border-orange-500"
                title="Show QR Code"
              >
                <LuQrCode size={20} />
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg">TEAMS</div>
            <div className="text-3xl font-pixel-header">{teams.length}/5</div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="mb-4 text-xl font-pixel-header flex items-center gap-2">
                <LuUsers /> ADD TEAM
              </h2>
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
                    if (newTeamName && newTeamSlogan) {
                      actions.addTeam(newTeamName, newTeamSlogan);
                      setNewTeamName('');
                      setNewTeamSlogan('');
                    }
                  }}
                  disabled={teams.length >= 5}
                  className="w-full bg-indigo-500 p-3 font-pixel-header text-white border-4 border-black hover:bg-indigo-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
                >
                  ADD TEAM
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <div className="font-pixel-header text-lg">{team.name}</div>
                    <div className="text-lg text-orange-800">&quot;{team.slogan}&quot;</div>
                  </div>
                  <div className="text-sm font-mono bg-orange-100 px-2 py-1 border-2 border-black">ID: {team.id}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={actions.startGame}
              disabled={teams.length < 2}
              className="group relative h-32 w-full max-w-sm bg-green-500 border-4 border-black p-1 transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-2xl font-pixel-header text-white flex items-center gap-3 drop-shadow-md">
                  START GAME <LuPlay />
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'PLAYING' && round) {
    return (
      <div className="min-h-screen p-6 text-orange-950 font-pixel-body">
        <header className="mb-6 flex items-center justify-between border-b-4 border-black pb-4 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <div className="text-sm font-bold text-orange-500 uppercase tracking-wider font-pixel-header">ROUND {round.index + 1}</div>
            <div className="text-xl font-bold text-black font-pixel-header mt-1">
              SPEAKER: {teams.find(t => t.id === round.speakerTeamId)?.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-orange-500 uppercase tracking-wider font-pixel-header">PHASE</div>
            <div className="text-xl font-bold text-indigo-600 font-pixel-header mt-1">{round.phase}</div>
          </div>
        </header>

        <div className="grid gap-6">
          {/* Phase Controls */}
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="mb-4 text-xl font-pixel-header text-black">GAME CONTROLS</h2>
            
            {round.phase === 'GUESSING' && (
               <div className="space-y-4">
                 <div className="p-4 bg-orange-50 border-4 border-black">
                   <h3 className="text-lg font-bold text-orange-800 mb-2 font-pixel-header">VOTES CAST</h3>
                   <div className="flex gap-2 flex-wrap">
                     {teams.filter(t => t.id !== round.speakerTeamId).map(t => (
                       <div key={t.id} className={`px-3 py-1 border-2 border-black text-sm font-bold ${round.votes[t.id] !== undefined ? 'bg-green-400 text-black' : 'bg-gray-200 text-gray-500'}`}>
                         {t.name}
                       </div>
                     ))}
                   </div>
                 </div>
                 <button
                   onClick={actions.revealFake}
                   className="w-full h-16 bg-orange-500 text-xl font-pixel-header text-white border-4 border-black hover:bg-orange-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 transition-all"
                 >
                   <LuEye /> REVEAL ANSWER
                 </button>
               </div>
            )}

            {round.phase === 'REVEAL' && (
              <button
                onClick={actions.applyScores}
                className="w-full h-16 bg-green-500 text-xl font-pixel-header text-white border-4 border-black hover:bg-green-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 transition-all"
              >
                <LuZap /> APPLY SCORES
              </button>
            )}

            {round.phase === 'SCORED' && (
              <button
                onClick={actions.nextRound}
                className="w-full h-16 bg-indigo-600 text-xl font-pixel-header text-white border-4 border-black hover:bg-indigo-500 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 transition-all"
              >
                NEXT ROUND <LuArrowRight />
              </button>
            )}
            
            {round.phase === 'SPEAKER_PREP' && (
               <div className="text-center p-8 text-orange-400 italic font-pixel-body text-xl">
                 WAITING FOR SPEAKER TO SUBMIT STATEMENTS...
               </div>
            )}
          </div>

          {/* Speaker Content (Hidden until needed, but visible to MC) */}
          {round.speakerContent && (
            <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="mb-4 text-xl font-pixel-header text-black">STATEMENTS (MC VIEW)</h2>
              <div className="space-y-4">
                {round.speakerContent.statements.map((stmt, idx) => (
                  <div key={idx} className={`p-4 border-4 ${idx === round.speakerContent?.fakeIndex ? 'border-red-500 bg-red-50' : 'border-black bg-orange-50'}`}>
                    <span className="font-pixel-header font-bold mr-4 text-orange-900">#{idx + 1}</span>
                    <span className="text-xl">{stmt}</span>
                    {idx === round.speakerContent?.fakeIndex && <span className="ml-2 text-sm font-bold text-red-600 font-pixel-header">[FAKE]</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Powers Panel */}
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
             <h2 className="mb-4 text-xl font-pixel-header text-black">POWERS</h2>
             <div className="grid grid-cols-2 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="p-3 bg-orange-50 border-4 border-black">
                    <div className="font-pixel-header mb-2 text-sm">{team.name} ({team.energy})</div>
                    <div className="flex gap-2">
                      <button 
                        disabled={!team.powerFlags.takeBreakAvailable}
                        onClick={() => {
                          if (confirm(`Use "Take a Break" on ${team.name}? If they answer WRONG, they lose 1 energy.`)) {
                             if (confirm("Did they answer WRONG? (Click OK to deduct energy, Cancel if they got it right)")) {
                               actions.applyBreakPenalty(team.id);
                             }
                          }
                        }}
                        className="flex-1 py-2 bg-blue-100 text-blue-800 border-2 border-black text-xs font-bold font-pixel-header disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 hover:bg-blue-200 transition-colors"
                      >
                        <LuCoffee className="inline mr-1"/> BREAK
                      </button>
                      <button 
                        disabled={!team.powerFlags.boostAvailable}
                        onClick={() => {
                           // Simple prompt for MVP
                           const target = prompt("Enter target team ID to steal from:");
                           if (target) actions.useBoost(team.id, target);
                        }}
                        className="flex-1 py-2 bg-yellow-100 text-yellow-800 border-2 border-black text-xs font-bold font-pixel-header disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 hover:bg-yellow-200 transition-colors"
                      >
                        <LuZap className="inline mr-1"/> BOOST
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="p-8 text-orange-950 font-pixel-header">GAME OVER OR UNKNOWN STATE</div>;
}
