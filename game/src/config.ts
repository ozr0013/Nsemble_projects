export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
/** inset of the arena walls from the canvas edge */
export const WALL_THICKNESS = 24;

export const PLAYER = {
  radius: 14,
  fireCooldownMs: 140,
  knockbackMs: 160,
  knockbackSpeed: 420,
} as const;

export const BULLET = {
  speed: 620,
  lifespanMs: 900,
  damage: 1,
  poolSize: 64,
} as const;

/**
 * Until UI and game flow ships a menu, the engine starts a run on boot and binds
 * Esc (pause) and R (restart) itself. Luke: set this to false when the menu lands.
 */
export const AUTO_START = true;
