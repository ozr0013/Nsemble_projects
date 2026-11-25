import Phaser from 'phaser';
import { TextureKeys } from '../contracts/assets';
import { PLAYER } from '../config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private knockbackUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(PLAYER.radius, this.width / 2 - PLAYER.radius, this.height / 2 - PLAYER.radius);
    body.setCollideWorldBounds(true);
    this.setDepth(10);
  }

  /** dir is the raw input vector; it gets normalized so diagonals aren't faster. */
  move(dir: Phaser.Math.Vector2, speed: number, now: number): void {
    if (now < this.knockbackUntil) return;
    if (dir.lengthSq() > 0) dir.normalize().scale(speed);
    this.setVelocity(dir.x, dir.y);
  }

  aimAt(x: number, y: number): number {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
    this.setRotation(angle);
    return angle;
  }

  knockback(fromX: number, fromY: number, now: number): void {
    const v = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY);
    if (v.lengthSq() === 0) v.set(1, 0);
    v.normalize().scale(PLAYER.knockbackSpeed);
    this.setVelocity(v.x, v.y);
    this.knockbackUntil = now + PLAYER.knockbackMs;
  }

  /** blink while invulnerable */
  showInvulnerable(active: boolean, now: number): void {
    this.setAlpha(active ? (Math.floor(now / 80) % 2 ? 0.35 : 1) : 1);
  }
}
