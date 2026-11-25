import Phaser from 'phaser';
import { SceneKeys, TextureKeys } from '../contracts/assets';
import { preloadAssets } from '../assets/preload';
import { PLAYER } from '../config';

/** Loads real assets (if any) and fills gaps with generated placeholders. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.boot);
  }

  preload(): void {
    preloadAssets(this);
  }

  create(): void {
    this.placeholder(TextureKeys.player, (g) => {
      const r = PLAYER.radius;
      g.fillStyle(0x7aa2ff).fillCircle(r, r, r);
      g.fillStyle(0xffffff).fillCircle(r * 1.6, r, r * 0.35); // "nose" shows facing
    }, PLAYER.radius * 2, PLAYER.radius * 2);

    this.placeholder(TextureKeys.bullet, (g) => {
      g.fillStyle(0xffe27a).fillCircle(4, 4, 4);
    }, 8, 8);

    this.placeholder(TextureKeys.enemyBasic, (g) => {
      g.fillStyle(0xff6b6b).fillRoundedRect(0, 0, 26, 26, 6);
      g.fillStyle(0x2a0f12).fillRect(6, 8, 4, 4).fillRect(16, 8, 4, 4);
    }, 26, 26);

    this.placeholder(TextureKeys.wall, (g) => {
      g.fillStyle(0x2b3245).fillRect(0, 0, 32, 32);
      g.lineStyle(2, 0x3b4560).strokeRect(1, 1, 30, 30);
    }, 32, 32);

    this.placeholder(TextureKeys.floor, (g) => {
      g.fillStyle(0x141824).fillRect(0, 0, 64, 64);
      g.lineStyle(1, 0x1b2030).strokeRect(0, 0, 64, 64);
    }, 64, 64);

    this.scene.start(SceneKeys.game);
  }

  private placeholder(
    key: string,
    draw: (g: Phaser.GameObjects.Graphics) => void,
    w: number,
    h: number,
  ): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
