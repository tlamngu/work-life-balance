'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';

export default function HostPage() {
  const router = useRouter();

  useEffect(() => {
    const socket = io({ path: '/api/socket' });
    socket.emit('create_room', (roomCode: string) => {
      router.push(`/mc/${roomCode}`);
    });
    return () => { socket.disconnect(); };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-orange-950 relative">
      <Link href="/" className="absolute top-6 left-6 p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all">
        <LuArrowLeft className="h-6 w-6 text-black" />
      </Link>
      <div className="text-2xl font-pixel-header animate-pulse">CREATING ROOM...</div>
    </div>
  );
}
