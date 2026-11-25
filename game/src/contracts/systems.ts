/**
 * CONTRACT: plug-in systems
 * The engine owns the scene, loop and physics. The Enemies part plugs in by implementing
 * EnemySystem; the engine calls it each frame and wires collisions to its group.
 */
import type Phaser from 'phaser';
import type { Vec2 } from './GameState';

/** Every enemy sprite in EnemySystem.group must satisfy this. */
export interface EnemyLike extends Phaser.Physics.Arcade.Sprite {
  enemyId: string;
  enemyType: string;
  /** damage dealt to the player on contact */
  contactDamage: number;
  /** points awarded on kill */
  points: number;
  /** apply damage; return true if this hit killed the enemy */
  takeHit(amount: number): boolean;
}

export interface EnemySystemContext {
  scene: Phaser.Scene;
  /** current player position, read-only */
  getPlayerPos(): Vec2;
  /** arena bounds enemies should spawn in / stay inside */
  bounds: Phaser.Geom.Rectangle;
  /** static obstacles, for pathing */
  walls: Phaser.Physics.Arcade.StaticGroup;
}

export interface EnemySystem {
  /** physics group holding every live EnemyLike */
  readonly group: Phaser.Physics.Arcade.Group;
  init(ctx: EnemySystemContext): void;
  update(time: number, delta: number): void;
  /** clear all enemies and reset waves (called on restart) */
  reset(): void;
}

export type EnemySystemFactory = () => EnemySystem;
