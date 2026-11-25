import type { GameEventName, GameEvents } from '../contracts/events';

type Handler<K extends GameEventName> = (payload: GameEvents[K]) => void;

/**
 * Typed pub/sub. Framework-free so it can be unit tested and shared by every part.
 * Usage: bus.on('enemyKilled', e => ...); bus.emit('enemyKilled', {...})
 */
export class EventBus {
  private handlers = new Map<GameEventName, Set<Handler<never>>>();

  on<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  once<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<K extends GameEventName>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends GameEventName>(event: K, payload: GameEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // copy so handlers can unsubscribe while we iterate
    for (const h of [...set]) (h as Handler<K>)(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** The shared bus for the running game. */
export const bus = new EventBus();
