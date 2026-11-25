import type Phaser from 'phaser';

/**
 * OWNER: UI and game flow (Luke).
 * Return your UI scene classes here (menus, HUD, pause, game over). They are added to
 * the game after the engine scenes. Read state with getStore(scene).state and listen
 * on the bus; ask the engine to start / pause / resume / restart via request* events.
 */
export const uiScenes: Phaser.Types.Scenes.SceneType[] = [];
