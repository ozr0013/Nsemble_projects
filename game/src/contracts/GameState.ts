/**
 * CONTRACT: GameState
 * Owned by Core engine. Everyone reads this; only the engine's GameStateStore writes it.
 * Other parts change state by emitting events (see events.ts), never by mutating it.
 */
export type GameStatus = 'boot' | 'menu' | 'playing' | 'paused' | 'gameover';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  pos: Vec2;
  hp: number;
  maxHp: number;
  /** pixels per second */
  speed: number;
  /** game time (ms) until which the player can't be hurt again */
  invulnerableUntil: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  kills: number;
  /** current wave, set by the Enemies part via 'waveStarted' */
  wave: number;
  /** ms of play time, paused time excluded */
  elapsedMs: number;
  player: PlayerState;
}

export const PLAYER_DEFAULTS: Readonly<Pick<PlayerState, 'hp' | 'maxHp' | 'speed'>> = {
  hp: 100,
  maxHp: 100,
  speed: 220,
};

/** ms of invulnerability after the player takes a hit */
export const PLAYER_IFRAMES_MS = 800;

export function createInitialState(spawn: Vec2): GameState {
  return {
    status: 'boot',
    score: 0,
    kills: 0,
    wave: 0,
    elapsedMs: 0,
    player: {
      pos: { ...spawn },
      hp: PLAYER_DEFAULTS.hp,
      maxHp: PLAYER_DEFAULTS.maxHp,
      speed: PLAYER_DEFAULTS.speed,
      invulnerableUntil: 0,
    },
  };
}
