import Phaser from 'phaser';
import { TextureKeys } from '../contracts/assets';
import type { EnemyLike, EnemySystem, EnemySystemContext } from '../contracts/systems';
import { bus } from '../core/EventBus';

/**
 * PLACEHOLDER owned by Core engine, to be REPLACED by Enemies and AI (Archer).
 * It exists only so the engine's collisions and damage can be played and tested.
 * Swap it out in enemies/index.ts; the engine doesn't import this file directly.
 */
let nextId = 0;

class ChaserEnemy extends Phaser.Physics.Arcade.Sprite implements EnemyLike {
  enemyId = `chaser-${nextId++}`;
  enemyType = 'chaser';
  contactDamage = 10;
  points = 10;
  private hp = 3;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.enemyBasic);
  }

  takeHit(amount: number): boolean {
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.active && this.clearTint());
    if (this.hp <= 0) {
      // disable now, destroy next tick: never destroy a body mid physics step
      this.disableBody(true, true);
      this.scene.time.delayedCall(0, () => this.destroy());
      return true;
    }
    return false;
  }
}

export class PlaceholderEnemySystem implements EnemySystem {
  group!: Phaser.Physics.Arcade.Group;
  private ctx!: EnemySystemContext;
  private nextSpawn = 0;
  private readonly spawnEveryMs = 1400;
  private readonly maxAlive = 10;
  private readonly speed = 90;

  init(ctx: EnemySystemContext): void {
    this.ctx = ctx;
    this.group = ctx.scene.physics.add.group({ classType: ChaserEnemy });
    bus.emit('waveStarted', { wave: 1, enemyCount: Infinity });
  }

  update(time: number): void {
    if (time >= this.nextSpawn && this.group.countActive() < this.maxAlive) {
      this.spawn();
      this.nextSpawn = time + this.spawnEveryMs;
    }
    const target = this.ctx.getPlayerPos();
    for (const e of this.group.getChildren() as ChaserEnemy[]) {
      if (!e.active) continue;
      this.ctx.scene.physics.moveTo(e, target.x, target.y, this.speed);
    }
  }

  reset(): void {
    this.group.clear(true, true);
    this.nextSpawn = 0;
    bus.emit('waveStarted', { wave: 1, enemyCount: Infinity });
  }

  /** spawn on a random arena edge, away from the player */
  private spawn(): void {
    const b = this.ctx.bounds;
    const p = this.ctx.getPlayerPos();
    let x = 0;
    let y = 0;
    for (let i = 0; i < 8; i++) {
      const edge = Phaser.Math.Between(0, 3);
      x = edge < 2 ? Phaser.Math.Between(b.left + 20, b.right - 20) : edge === 2 ? b.left + 20 : b.right - 20;
      y = edge >= 2 ? Phaser.Math.Between(b.top + 20, b.bottom - 20) : edge === 0 ? b.top + 20 : b.bottom - 20;
      if (Phaser.Math.Distance.Between(x, y, p.x, p.y) > 220) break;
    }
    const e = new ChaserEnemy(this.ctx.scene, x, y);
    this.ctx.scene.add.existing(e);
    this.group.add(e);
  }
}
