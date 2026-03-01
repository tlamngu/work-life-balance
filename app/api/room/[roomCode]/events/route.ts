import { NextRequest } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const roomCode = (await params).roomCode;
  let controllerRef: ReadableStreamDefaultController<any>;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      store.addEmitter(roomCode, controller);
    },
    cancel() {
      if (controllerRef) {
        store.removeEmitter(roomCode, controllerRef);
      }
    }
  });

  req.signal.addEventListener('abort', () => {
    if (controllerRef) {
      store.removeEmitter(roomCode, controllerRef);
      try {
        controllerRef.close();
      } catch (err) {}
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering on Nginx (if any)
    }
  });
}