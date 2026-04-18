'use client';

import { useGame } from '@/hooks/useGame';
import { STATEMENT_COUNT } from '@/types';
import { motion } from 'motion/react';
import { LuZap, LuCoffee } from 'react-icons/lu';
import QRCode from 'react-qr-code';

const statementIndexes = Array.from({ length: STATEMENT_COUNT }, (_, index) => index);

export default function BoardView({ roomCode }: { roomCode: string }) {
  const { roomState, isConnected } = useGame(roomCode);

  if (!isConnected || !roomState) return <div className="flex h-screen items-center justify-center p-8 text-orange-950 font-pixel-header text-4xl animate-pulse">CONNECTING...</div>;

  const { teams, round, status } = roomState;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${roomCode}` : '';
  const winnerTeam = teams.find((team) => team.id === roomState.winnerTeamId);

  return (
    <div className="min-h-screen p-8 text-orange-950 font-pixel-body overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-orange-400 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <LuZap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-pixel-header text-orange-600 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            ENERGY BAR
          </h1>
        </div>
        
        <div className="flex items-center gap-8">
           {/* QR Code for joining - visible in Lobby */}
           {status === 'LOBBY' && (
             <div className="bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 pr-4">
               <QRCode value={joinUrl} size={64} />
               <div className="text-left">
                 <div className="text-xs font-bold text-orange-500 font-pixel-header">SCAN TO JOIN</div>
                 <div className="text-sm font-pixel-body">play.energybar.game</div>
               </div>
             </div>
           )}

           <div className="text-right">
             <div className="text-sm font-bold text-orange-500 font-pixel-header">ROOM CODE</div>
             <div className="text-5xl font-pixel-header text-black">{roomCode}</div>
           </div>
           {round && (
             <div className="px-8 py-4 bg-indigo-500 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <div className="text-sm font-bold text-white font-pixel-header mb-1">PHASE</div>
               <div className="text-3xl font-pixel-header text-white uppercase">{round.phase.replace('_', ' ')}</div>
             </div>
           )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid gap-8 content-center">
        {teams.map((team) => {
          const isSpeaker = round?.speakerTeamId === team.id;
          
          return (
            <div key={team.id} className="relative">
              {/* Team Info */}
              <div className="flex items-end justify-between mb-2 px-2">
                <div className="flex items-center gap-4">
                  <h2 className={`text-3xl font-pixel-header uppercase transition-colors ${isSpeaker ? 'text-orange-600' : 'text-black'}`}>
                    {team.name}
                    {isSpeaker && <span className="ml-4 text-sm bg-yellow-400 text-black px-2 py-1 border-2 border-black align-middle animate-pulse">SPEAKER</span>}
                  </h2>
                  <span className="text-orange-800 font-pixel-body text-xl">&quot;{team.slogan}&quot;</span>
                </div>
                <div className="text-2xl font-pixel-header text-orange-900">
                  {team.energy}/7
                </div>
              </div>

              {/* Bar Container */}
              <div className="h-16 w-full bg-white border-4 border-black relative shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                {/* Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-7 divide-x-4 divide-black z-10 pointer-events-none">
                  {[...Array(7)].map((_, i) => <div key={i} className="h-full" />)}
                </div>

                {/* Fill Animation */}
                <motion.div
                  className={`h-full ${isSpeaker ? 'bg-yellow-400' : 'bg-indigo-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(team.energy / 7) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                />

                {/* Milestone Markers */}
                <div className="absolute top-0 left-[42.8%] h-full w-1 bg-transparent z-20 flex flex-col justify-center items-center -ml-px">
                   <div className="bg-blue-100 p-1 border-2 border-black transform translate-y-[-50%] top-1/2 absolute">
                     <LuCoffee className="h-4 w-4 text-blue-600" />
                   </div>
                </div>
                <div className="absolute top-0 left-[71.4%] h-full w-1 bg-transparent z-20 flex flex-col justify-center items-center -ml-px">
                   <div className="bg-yellow-100 p-1 border-2 border-black transform translate-y-[-50%] top-1/2 absolute">
                     <LuZap className="h-4 w-4 text-yellow-600" />
                   </div>
                </div>
              </div>
            </div>
          );
        })}

        {teams.length === 0 && (
          <div className="text-center text-orange-400 text-2xl font-pixel-header">
            WAITING FOR TEAMS TO JOIN...
          </div>
        )}
      </div>

      {round?.phase === 'GUESSING' || round?.phase === 'REVEAL' ? (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-white border-8 border-black p-8 w-full max-w-6xl shadow-[16px_16px_0px_0px_rgba(255,165,0,1)] relative flex flex-col gap-8 max-h-full overflow-y-auto">
            <h2 className="text-5xl font-pixel-header text-center text-black drop-shadow-[4px_4px_0px_rgba(255,165,0,0.5)]">
               {round.phase === 'GUESSING' ? 'WHICH STATEMENT IS FAKE?' : 'THE TRUTH REVEALED!'}
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              {statementIndexes.map((idx) => {
                const isFake = round.speakerContent?.fakeIndex === idx;
                const isRevealed = round.phase === 'REVEAL';

                // Find teams that voted for this index
                const votingTeams = teams.filter(t => t.id !== round.speakerTeamId && round.votes[t.id] === idx);

                return (
                  <div key={idx} className={`border-4 border-black p-6 flex flex-col items-center justify-start gap-4 transition-all duration-700 relative overflow-hidden ${isRevealed ? (isFake ? 'bg-green-400' : 'bg-red-400') : 'bg-orange-100'}`}>
                    
                    <div className={`text-6xl font-pixel-header ${isRevealed ? 'text-black' : 'text-orange-300'}`}>
                      #{idx + 1}
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-2xl font-pixel-body font-bold text-center text-black p-4 bg-white/50 border-2 border-black rounded"
                    >
                      STATEMENT #{idx + 1}
                    </motion.div>

                    {isRevealed && (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`text-3xl font-pixel-header mt-2 ${isFake ? 'text-black' : 'text-white'}`}
                      >
                        {isFake ? 'FAKE! (CORRECT)' : 'TRUE (FOOLED)'}
                      </motion.div>
                    )}

                    <div className="w-full mt-4 flex-1">
                      <div className="border-t-4 border-black/20 pt-4 w-full flex flex-wrap justify-center gap-2">
                        {votingTeams.length === 0 ? (
                          <div className="font-pixel-body text-black/30">No votes yet</div>
                        ) : (
                          votingTeams.map(t => (
                            <motion.div 
                              key={t.id}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-4 py-2 bg-indigo-500 border-2 border-black text-white font-pixel-header text-lg"
                            >
                              {t.name}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Unrevealed state blind voting team counts to build tension */}
                    {!isRevealed && round.phase === 'GUESSING' && votingTeams.length > 0 && (
                       <div className="absolute bottom-2 right-2 text-6xl font-pixel-header text-black/10">
                          {votingTeams.length}
                       </div>
                    )}

                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4">
               {teams.filter(t => t.id !== round.speakerTeamId).map(t => {
                   const hasVoted = round.votes[t.id] !== undefined;
                   return (
                     <div key={t.id} className={`px-4 py-2 border-2 border-black font-pixel-header text-lg ${hasVoted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500 animate-pulse'}`}>
                       {t.name}: {hasVoted ? 'READY' : 'THINKING...'}
                     </div>
                   )
               })}
            </div>
          </div>
        </div>
      ) : null}

      {status === 'ENDED' ? (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-white border-8 border-black p-8 w-full max-w-4xl shadow-[16px_16px_0px_0px_rgba(255,165,0,1)] text-center">
            <h2 className="text-6xl font-pixel-header text-black mb-4">CONGRATULATIONS!</h2>
            <p className="text-3xl font-pixel-body text-orange-800 mb-4">
              {winnerTeam ? `${winnerTeam.name} WINS!` : 'A TEAM WINS!'}
            </p>
            <p className="text-lg font-pixel-body text-black">
              MC is deciding to restart or end the session.
            </p>
          </div>
        </div>
      ) : null}

      {/* Footer / Timer */}
      {round?.timer && (
         <div className="fixed bottom-0 left-0 w-full h-4 bg-black">
            <motion.div 
               className="h-full bg-yellow-400"
               initial={{ width: '100%' }}
               animate={{ width: '0%' }}
               transition={{ duration: round.timer.duration / 1000, ease: 'linear' }}
            />
         </div>
      )}
    </div>
  );
}
