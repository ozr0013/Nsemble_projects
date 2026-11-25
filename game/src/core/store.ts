import type Phaser from 'phaser';
import type { GameStateStore } from './GameStateStore';

const KEY = 'store';

export function setStore(scene: Phaser.Scene, store: GameStateStore): void {
  scene.registry.set(KEY, store);
}

/** Any scene (e.g. UIScene) can read the live store: getStore(this).state.score */
export function getStore(scene: Phaser.Scene): GameStateStore {
  const store = scene.registry.get(KEY) as GameStateStore | undefined;
  if (!store) throw new Error('GameStateStore not created yet (GameScene must start first)');
  return store;
}
