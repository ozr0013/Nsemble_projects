import Phaser from 'phaser';
import { TextureKeys } from '../contracts/assets';
import { BULLET } from '../config';

export class Projectile extends Phaser.Physics.Arcade.Image {
  damage: number = BULLET.damage;
  private expiresAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.bullet);
  }

  fire(x: number, y: number, angle: number, now: number): void {
    this.enableBody(true, x, y, true, true);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(4);
    this.setRotation(angle);
    this.scene.physics.velocityFromRotation(angle, BULLET.speed, (this.body as Phaser.Physics.Arcade.Body).velocity);
    this.expiresAt = now + BULLET.lifespanMs;
  }

  kill(): void {
    this.disableBody(true, true);
  }

  /** called by the group (runChildUpdate) every frame */
  update(time: number): void {
    if (this.active && time >= this.expiresAt) this.kill();
  }
}
