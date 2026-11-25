/**
 * CONTRACT: asset keys
 * Assets and audio loads real files under these keys. Until then the engine generates
 * placeholder textures with the same keys, so nothing else has to change when art lands.
 */
export const TextureKeys = {
  player: 'player',
  bullet: 'bullet',
  wall: 'wall',
  floor: 'floor',
  enemyBasic: 'enemy-basic',
} as const;

export const SoundKeys = {
  shoot: 'sfx-shoot',
  hit: 'sfx-hit',
  playerHurt: 'sfx-player-hurt',
  enemyDie: 'sfx-enemy-die',
  music: 'music-main',
} as const;

export type TextureKey = (typeof TextureKeys)[keyof typeof TextureKeys];
export type SoundKey = (typeof SoundKeys)[keyof typeof SoundKeys];

/** Scene keys, so UI can launch / stop scenes by name. */
export const SceneKeys = {
  boot: 'BootScene',
  game: 'GameScene',
  ui: 'UIScene',
} as const;
