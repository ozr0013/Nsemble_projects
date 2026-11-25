import Phaser from 'phaser';
import type { EnemyLike } from '../contracts/systems';
import type { GameStateStore } from '../core/GameStateStore';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';

export interface CollisionTargets {
  player: Player;
  walls: Phaser.Physics.Arcade.StaticGroup;
  bullets: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
}

/**
 * All collision rules in one place:
 *  player  <-> walls    : block
 *  enemies <-> walls    : block
 *  enemies <-> enemies  : separate (no stacking)
 *  bullets  -> walls    : bullet dies
 *  bullets  -> enemies  : enemy.takeHit, bullet dies, kill is recorded
 *  enemies  -> player   : contact damage (i-frames) + knockback
 */
export function registerCollisions(
  scene: Phaser.Scene,
  store: GameStateStore,
  t: CollisionTargets,
): Phaser.Physics.Arcade.Collider[] {
  const p = scene.physics.add;
  return [
    p.collider(t.player, t.walls),
    p.collider(t.enemies, t.walls),
    p.collider(t.enemies, t.enemies),

    p.collider(t.bullets, t.walls, (b) => (b as Projectile).kill()),

    p.overlap(t.bullets, t.enemies, (b, e) => {
      const bullet = b as Projectile;
      const enemy = e as EnemyLike;
      if (!bullet.active || !enemy.active) return;
      bullet.kill();
      const { x, y } = enemy;
      if (enemy.takeHit(bullet.damage)) {
        store.recordKill(enemy.enemyId, enemy.enemyType, { x, y }, enemy.points);
      }
    }),

    p.overlap(t.player, t.enemies, (_pl, e) => {
      const enemy = e as EnemyLike;
      if (!enemy.active) return;
      const now = scene.time.now;
      if (store.damagePlayer(enemy.contactDamage, enemy.enemyType, now) > 0) {
        t.player.knockback(enemy.x, enemy.y, now);
        scene.cameras.main.shake(90, 0.004);
      }
    }),
  ];
}
