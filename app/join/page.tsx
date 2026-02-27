'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuArrowLeft, LuScan, LuX } from 'react-icons/lu';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length > 0) {
      router.push(`/play/${code.toUpperCase()}`);
    }
  };

  const handleScan = (result: any) => {
    if (result && result[0] && result[0].rawValue) {
      const scannedValue = result[0].rawValue;
      // Extract room code if it's a URL
      const match = scannedValue.match(/\/play\/([A-Z0-9]+)/i);
      const roomCode = match ? match[1] : scannedValue;
      
      if (roomCode) {
        setCode(roomCode.toUpperCase());
        setIsScanning(false);
        router.push(`/play/${roomCode.toUpperCase()}`);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-orange-950 relative">
      <Link href="/" className="absolute top-6 left-6 p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all z-20">
        <LuArrowLeft className="h-6 w-6 text-black" />
      </Link>

      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-4 border-4 border-orange-500 rounded-lg relative">
            <button 
              onClick={() => setIsScanning(false)}
              className="absolute -top-12 right-0 p-2 bg-white border-4 border-black text-black hover:bg-red-100"
            >
              <LuX className="h-6 w-6" />
            </button>
            <h2 className="text-center font-pixel-header text-xl mb-4">SCAN QR CODE</h2>
            <div className="aspect-square overflow-hidden border-4 border-black">
              <Scanner 
                onScan={handleScan}
                allowMultiple={true}
                scanDelay={500}
              />
            </div>
            <p className="text-center mt-4 font-pixel-body text-lg">POINT CAMERA AT ROOM QR CODE</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8 bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <h1 className="text-3xl font-pixel-header text-center text-orange-600">JOIN GAME</h1>
        
        <div className="space-y-4">
          <label className="block text-lg font-pixel-body font-bold">ROOM CODE:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XK9F2A"
              className="flex-1 border-4 border-black bg-orange-50 p-4 text-center text-3xl font-pixel-header tracking-widest uppercase placeholder:text-orange-200 focus:outline-none focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="bg-orange-100 border-4 border-black p-4 hover:bg-orange-200 active:bg-orange-300 transition-colors"
              title="Scan QR Code"
            >
              <LuScan className="h-8 w-8 text-orange-800" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 border-4 border-black p-4 text-xl font-pixel-header text-white hover:bg-orange-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
        >
          ENTER ROOM
        </button>
      </form>
    </div>
  );
}
