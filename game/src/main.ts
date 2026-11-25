import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { uiScenes } from './ui';
import { bus } from './core/EventBus';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0b0d12',
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: { debug: false, fps: 60 },
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, GameScene, ...uiScenes],
});

// handy in devtools: window.__game, window.__bus
Object.assign(window, { __game: game, __bus: bus });
