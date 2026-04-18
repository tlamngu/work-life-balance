import { NextRequest } from 'next/server';
import { getRoomState } from '@/lib/room-service';

export const runtime = 'nodejs';

const POLL_INTERVAL_MS = 1000;

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const roomCode = (await params).roomCode;
  const encoder = new TextEncoder();
  let intervalRef: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let pushing = false;
  let lastSerialized = '';

  const stream = new ReadableStream({
    async start(controller) {
      const cleanup = () => {
        closed = true;
        if (intervalRef) {
          clearInterval(intervalRef);
          intervalRef = null;
        }
      };

      const pushLatest = async () => {
        if (closed || pushing) {
          return;
        }

        pushing = true;
        try {
          const room = await getRoomState(roomCode);
          if (!room) {
            controller.enqueue(encoder.encode('event: room_missing\ndata: {"error":"Room not found"}\n\n'));
            cleanup();
            controller.close();
            return;
          }

          const serialized = JSON.stringify(room);
          if (serialized !== lastSerialized) {
            controller.enqueue(encoder.encode(`data: ${serialized}\n\n`));
            lastSerialized = serialized;
          } else {
            controller.enqueue(encoder.encode(': keep-alive\n\n'));
          }
        } catch (error) {
          controller.enqueue(encoder.encode('event: error\ndata: {"error":"Failed to stream room updates"}\n\n'));
        } finally {
          pushing = false;
        }
      };

      await pushLatest();
      intervalRef = setInterval(() => {
        void pushLatest();
      }, POLL_INTERVAL_MS);

      req.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Ignore close races if already closed.
        }
      });
    },
    cancel() {
      closed = true;
      if (intervalRef) {
        clearInterval(intervalRef);
        intervalRef = null;
      }
    },
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