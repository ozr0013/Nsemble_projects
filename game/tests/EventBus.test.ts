import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/core/EventBus';

describe('EventBus', () => {
  it('delivers typed payloads to subscribers', () => {
    const bus = new EventBus();
    const h = vi.fn();
    bus.on('scoreChanged', h);
    bus.emit('scoreChanged', { score: 10, delta: 10 });
    expect(h).toHaveBeenCalledWith({ score: 10, delta: 10 });
  });

  it('unsubscribes via the returned function and off()', () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    const offA = bus.on('requestPause', a);
    bus.on('requestPause', b);
    offA();
    bus.off('requestPause', b);
    bus.emit('requestPause', {});
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('once() fires a single time', () => {
    const bus = new EventBus();
    const h = vi.fn();
    bus.once('requestStart', h);
    bus.emit('requestStart', {});
    bus.emit('requestStart', {});
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('lets a handler unsubscribe while emitting without skipping others', () => {
    const bus = new EventBus();
    const second = vi.fn();
    const off = bus.on('requestResume', () => off());
    bus.on('requestResume', second);
    bus.emit('requestResume', {});
    expect(second).toHaveBeenCalledTimes(1);
  });
});
