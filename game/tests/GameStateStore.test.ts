import { describe, expect, it, vi } from 'vitest';
import { PLAYER_DEFAULTS, PLAYER_IFRAMES_MS } from '../src/contracts/GameState';
import { EventBus } from '../src/core/EventBus';
import { GameStateStore } from '../src/core/GameStateStore';

const spawn = { x: 100, y: 100 };

function setup() {
  const bus = new EventBus();
  const store = new GameStateStore(bus, spawn);
  return { bus, store };
}

describe('GameStateStore', () => {
  it('starts in boot with default player stats', () => {
    const { store } = setup();
    expect(store.state.status).toBe('boot');
    expect(store.state.player.hp).toBe(PLAYER_DEFAULTS.hp);
    expect(store.state.player.pos).toEqual(spawn);
  });

  it('enforces status transitions and emits statusChanged', () => {
    const { bus, store } = setup();
    const h = vi.fn();
    bus.on('statusChanged', h);
    expect(store.setStatus('paused')).toBe(false); // boot -> paused not allowed
    expect(store.setStatus('playing')).toBe(true);
    expect(store.setStatus('paused')).toBe(true);
    expect(store.setStatus('playing')).toBe(true);
    expect(h).toHaveBeenCalledTimes(3);
    expect(h).toHaveBeenLastCalledWith({ from: 'paused', to: 'playing' });
  });

  it('only counts elapsed time while playing', () => {
    const { store } = setup();
    store.tick(16);
    store.startRun();
    store.tick(16);
    store.setStatus('paused');
    store.tick(1000);
    expect(store.state.elapsedMs).toBe(16);
  });

  it('applies damage with i-frames', () => {
    const { bus, store } = setup();
    const h = vi.fn();
    bus.on('playerDamaged', h);
    store.startRun();
    expect(store.damagePlayer(10, 'chaser', 1000)).toBe(10);
    expect(store.damagePlayer(10, 'chaser', 1000 + PLAYER_IFRAMES_MS - 1)).toBe(0);
    expect(store.damagePlayer(10, 'chaser', 1000 + PLAYER_IFRAMES_MS)).toBe(10);
    expect(store.state.player.hp).toBe(80);
    expect(h).toHaveBeenCalledTimes(2);
  });

  it('ignores damage when not playing', () => {
    const { store } = setup();
    expect(store.damagePlayer(10, 'x', 0)).toBe(0);
    store.startRun();
    store.setStatus('paused');
    expect(store.damagePlayer(10, 'x', 0)).toBe(0);
  });

  it('kills the player at 0 hp: playerDied, gameover, gameOver summary', () => {
    const { bus, store } = setup();
    const died = vi.fn();
    const over = vi.fn();
    bus.on('playerDied', died);
    bus.on('gameOver', over);
    store.startRun();
    store.recordKill('e1', 'chaser', { x: 0, y: 0 }, 25);
    store.setWave(3);
    expect(store.damagePlayer(999, 'boss', 0)).toBe(PLAYER_DEFAULTS.hp); // clamped
    expect(store.state.player.hp).toBe(0);
    expect(store.state.status).toBe('gameover');
    expect(died).toHaveBeenCalledOnce();
    expect(over).toHaveBeenCalledWith({ score: 25, kills: 1, wave: 3, elapsedMs: 0 });
  });

  it('records kills: enemyKilled + scoreChanged', () => {
    const { bus, store } = setup();
    const killed = vi.fn();
    const score = vi.fn();
    bus.on('enemyKilled', killed);
    bus.on('scoreChanged', score);
    store.startRun();
    store.recordKill('e1', 'chaser', { x: 5, y: 6 }, 10);
    store.recordKill('e2', 'chaser', { x: 5, y: 6 }, 10);
    expect(store.state.kills).toBe(2);
    expect(store.state.score).toBe(20);
    expect(killed).toHaveBeenCalledWith({ enemyId: 'e1', enemyType: 'chaser', pos: { x: 5, y: 6 }, points: 10 });
    expect(score).toHaveBeenLastCalledWith({ score: 20, delta: 10 });
  });

  it('heals up to max only', () => {
    const { store } = setup();
    store.startRun();
    store.damagePlayer(30, 'x', 0);
    expect(store.healPlayer(50)).toBe(30);
    expect(store.healPlayer(5)).toBe(0);
    expect(store.state.player.hp).toBe(PLAYER_DEFAULTS.maxHp);
  });

  it('startRun resets the run from gameover', () => {
    const { store } = setup();
    store.startRun();
    store.recordKill('e1', 'chaser', { x: 0, y: 0 }, 10);
    store.setPlayerPos({ x: 300, y: 300 });
    store.damagePlayer(999, 'x', 0);
    store.startRun();
    expect(store.state.status).toBe('playing');
    expect(store.state.score).toBe(0);
    expect(store.state.kills).toBe(0);
    expect(store.state.player.hp).toBe(PLAYER_DEFAULTS.hp);
    expect(store.state.player.pos).toEqual(spawn);
  });

  it('setPlayerPos only emits on real movement', () => {
    const { bus, store } = setup();
    const h = vi.fn();
    bus.on('playerMoved', h);
    store.setPlayerPos({ x: 100, y: 100 });
    store.setPlayerPos({ x: 101, y: 100 });
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('cannot resume out of gameover; only startRun leaves it', () => {
    const { store } = setup();
    store.startRun();
    store.damagePlayer(999, 'x', 0);
    expect(store.setStatus('playing')).toBe(false);
    expect(store.setStatus('paused')).toBe(false);
    expect(store.state.status).toBe('gameover');
    store.startRun();
    expect(store.state.status).toBe('playing');
  });
});
