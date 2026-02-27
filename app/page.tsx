'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { LuZap, LuUsers, LuMonitor } from 'react-icons/lu';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-orange-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12 text-center"
      >
        <div className="space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center bg-orange-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <LuZap className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-pixel-header leading-tight text-orange-600 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            ENERGY BAR
          </h1>
          <p className="text-2xl font-pixel-body text-orange-800">
            The multiplayer game about work-life balance.
          </p>
        </div>

        <div className="grid gap-6">
          <Link href="/host" className="group relative bg-orange-300 border-4 border-black p-6 transition-transform hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white border-2 border-black p-2">
                  <LuMonitor className="h-6 w-6 text-black" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-pixel-header text-black">HOST GAME</h3>
                  <p className="text-lg font-pixel-body text-orange-900">Create a room as MC</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/join" className="group relative bg-white border-4 border-black p-6 transition-transform hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 border-2 border-black p-2">
                  <LuUsers className="h-6 w-6 text-black" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-pixel-header text-black">JOIN GAME</h3>
                  <p className="text-lg font-pixel-body text-orange-900">Enter room code</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
