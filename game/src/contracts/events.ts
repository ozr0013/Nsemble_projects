/**
 * CONTRACT: event bus
 * The only way parts talk to each other. Add a new event here (with its payload type)
 * before emitting it, so every agent sees the change in one place.
 */
import type { GameStatus, Vec2 } from './GameState';

export interface GameEvents {
  // --- emitted by Core engine ---
  statusChanged: { from: GameStatus; to: GameStatus };
  playerMoved: { pos: Vec2 };
  playerDamaged: { amount: number; hp: number; maxHp: number; source: string };
  playerHealed: { amount: number; hp: number; maxHp: number };
  playerDied: { pos: Vec2 };
  projectileFired: { pos: Vec2; angle: number };
  /** engine emits this when a projectile or anything else kills an enemy */
  enemyKilled: { enemyId: string; enemyType: string; pos: Vec2; points: number };
  scoreChanged: { score: number; delta: number };
  gameOver: { score: number; kills: number; wave: number; elapsedMs: number };

  // --- emitted by Enemies and AI ---
  waveStarted: { wave: number; enemyCount: number };
  waveCleared: { wave: number };

  // --- emitted by UI and game flow (engine listens and acts) ---
  requestStart: Record<string, never>;
  requestPause: Record<string, never>;
  requestResume: Record<string, never>;
  requestRestart: Record<string, never>;
}

export type GameEventName = keyof GameEvents;
