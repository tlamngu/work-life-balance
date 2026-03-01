import { RoomState } from '@/types';

class Store {
  public rooms = new Map<string, RoomState>();
  public emitters = new Map<string, Set<ReadableStreamDefaultController<any>>>();

  emitRoomUpdate(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const controllers = this.emitters.get(roomCode);
    if (controllers) {
      const data = JSON.stringify(room);
      const encoder = new TextEncoder();
      const message = encoder.encode(`data: ${data}\n\n`);
      for (const controller of Array.from(controllers)) {
        try {
          controller.enqueue(message);
        } catch (err) {
          controllers.delete(controller);
        }
      }
    }
  }

  addEmitter(roomCode: string, controller: ReadableStreamDefaultController<any>) {
    if (!this.emitters.has(roomCode)) {
      this.emitters.set(roomCode, new Set());
    }
    this.emitters.get(roomCode)!.add(controller);
    
    // Send immediate initial state if available
    const room = this.rooms.get(roomCode);
    if (room) {
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(room)}\n\n`));
      } catch (err) {
        this.removeEmitter(roomCode, controller);
      }
    }
  }

  removeEmitter(roomCode: string, controller: ReadableStreamDefaultController<any>) {
    const controllers = this.emitters.get(roomCode);
    if (controllers) {
      controllers.delete(controller);
      if (controllers.size === 0) {
        this.emitters.delete(roomCode);
      }
    }
  }
}

// Global variable to persist between hot reloads in dev
const globalForStore = global as unknown as { store: Store };
export const store = globalForStore.store || new Store();
if (process.env.NODE_ENV !== 'production') globalForStore.store = store;
