import {
  createInitialState,
  PLAYER_IFRAMES_MS,
  type GameState,
  type GameStatus,
  type Vec2,
} from '../contracts/GameState';
import type { EventBus } from './EventBus';

const TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  boot: ['menu', 'playing'],
  menu: ['playing'],
  playing: ['paused', 'gameover', 'menu'],
  paused: ['playing', 'menu'],
  // gameover -> playing only happens through startRun(), never a plain resume
  gameover: ['menu'],
};

/**
 * The single writer of GameState. Pure logic (no Phaser), so it's unit tested.
 * Everything that changes state goes through here and is announced on the bus.
 */
export class GameStateStore {
  private s: GameState;

  constructor(
    private readonly bus: EventBus,
    private readonly spawn: Vec2,
  ) {
    this.s = createInitialState(spawn);
  }

  /** Read-only snapshot for other parts. */
  get state(): Readonly<GameState> {
    return this.s;
  }

  canTransition(to: GameStatus): boolean {
    return TRANSITIONS[this.s.status].includes(to);
  }

  setStatus(to: GameStatus): boolean {
    const from = this.s.status;
    if (from === to || !this.canTransition(to)) return false;
    this.s.status = to;
    this.bus.emit('statusChanged', { from, to });
    return true;
  }

  /** Fresh run: reset everything and go to 'playing'. */
  startRun(): void {
    const from = this.s.status;
    this.s = createInitialState(this.spawn);
    this.s.status = 'playing';
    if (from !== 'playing') this.bus.emit('statusChanged', { from, to: 'playing' });
  }

  tick(deltaMs: number): void {
    if (this.s.status === 'playing') this.s.elapsedMs += deltaMs;
  }

  setPlayerPos(pos: Vec2): void {
    const p = this.s.player.pos;
    if (p.x === pos.x && p.y === pos.y) return;
    p.x = pos.x;
    p.y = pos.y;
    this.bus.emit('playerMoved', { pos: { ...p } });
  }

  isPlayerInvulnerable(now: number): boolean {
    return now < this.s.player.invulnerableUntil;
  }

  /** Returns the damage actually applied (0 if blocked by i-frames or not playing). */
  damagePlayer(amount: number, source: string, now: number): number {
    const p = this.s.player;
    if (this.s.status !== 'playing' || amount <= 0 || p.hp <= 0) return 0;
    if (this.isPlayerInvulnerable(now)) return 0;
    const applied = Math.min(amount, p.hp);
    p.hp -= applied;
    p.invulnerableUntil = now + PLAYER_IFRAMES_MS;
    this.bus.emit('playerDamaged', { amount: applied, hp: p.hp, maxHp: p.maxHp, source });
    if (p.hp <= 0) {
      this.bus.emit('playerDied', { pos: { ...p.pos } });
      this.setStatus('gameover');
      this.bus.emit('gameOver', {
        score: this.s.score,
        kills: this.s.kills,
        wave: this.s.wave,
        elapsedMs: this.s.elapsedMs,
      });
    }
    return applied;
  }

  healPlayer(amount: number): number {
    const p = this.s.player;
    if (amount <= 0 || p.hp <= 0) return 0;
    const applied = Math.min(amount, p.maxHp - p.hp);
    if (applied === 0) return 0;
    p.hp += applied;
    this.bus.emit('playerHealed', { amount: applied, hp: p.hp, maxHp: p.maxHp });
    return applied;
  }

  recordKill(enemyId: string, enemyType: string, pos: Vec2, points: number): void {
    if (this.s.status !== 'playing') return;
    this.s.kills += 1;
    this.bus.emit('enemyKilled', { enemyId, enemyType, pos: { ...pos }, points });
    this.addScore(points);
  }

  addScore(delta: number): void {
    if (delta === 0) return;
    this.s.score = Math.max(0, this.s.score + delta);
    this.bus.emit('scoreChanged', { score: this.s.score, delta });
  }

  setWave(wave: number): void {
    this.s.wave = wave;
  }
}
