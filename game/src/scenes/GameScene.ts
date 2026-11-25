import Phaser from 'phaser';
import { SceneKeys, TextureKeys } from '../contracts/assets';
import type { EnemySystem } from '../contracts/systems';
import { AUTO_START, BULLET, GAME_HEIGHT, GAME_WIDTH, PLAYER, WALL_THICKNESS } from '../config';
import { bus } from '../core/EventBus';
import { GameStateStore } from '../core/GameStateStore';
import { setStore } from '../core/store';
import { createEnemySystem } from '../enemies';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { registerCollisions } from '../systems/CollisionSystem';

type Keys = Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'esc' | 'r', Phaser.Input.Keyboard.Key>;

/**
 * Core engine scene: arena, player, shooting, enemy plug-in, collisions and the game loop.
 */
export class GameScene extends Phaser.Scene {
  private store!: GameStateStore;
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: EnemySystem;
  private keys!: Keys;
  private nextFireAt = 0;
  private unsubs: Array<() => void> = [];
  private readonly arena = new Phaser.Geom.Rectangle(
    WALL_THICKNESS,
    WALL_THICKNESS,
    GAME_WIDTH - WALL_THICKNESS * 2,
    GAME_HEIGHT - WALL_THICKNESS * 2,
  );

  constructor() {
    super(SceneKeys.game);
  }

  create(): void {
    const spawn = { x: this.arena.centerX, y: this.arena.centerY };
    this.store = new GameStateStore(bus, spawn);
    setStore(this, this.store);

    this.physics.world.setBounds(this.arena.x, this.arena.y, this.arena.width, this.arena.height);
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, TextureKeys.floor).setOrigin(0);
    this.buildWalls();

    this.player = new Player(this, spawn.x, spawn.y);
    this.bullets = this.physics.add.group({
      classType: Projectile,
      maxSize: BULLET.poolSize,
      runChildUpdate: true,
    });

    this.bindInput();
    this.bindBus();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubs.forEach((u) => u()));

    // Set status before the enemy system inits, so its first 'waveStarted' isn't wiped by startRun().
    if (AUTO_START) this.store.startRun();
    else this.store.setStatus('menu');
    this.applyStatus();

    this.enemies = createEnemySystem();
    this.enemies.init({
      scene: this,
      getPlayerPos: () => ({ x: this.player.x, y: this.player.y }),
      bounds: this.arena,
      walls: this.walls,
    });

    registerCollisions(this, this.store, {
      player: this.player,
      walls: this.walls,
      bullets: this.bullets,
      enemies: this.enemies.group,
    });
  }

  update(time: number, delta: number): void {
    if (this.store.state.status !== 'playing') return;

    this.store.tick(delta);

    const dir = new Phaser.Math.Vector2(
      Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown),
      Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown),
    );
    this.player.move(dir, this.store.state.player.speed, time);

    const pointer = this.input.activePointer;
    const angle = this.player.aimAt(pointer.worldX, pointer.worldY);
    if (pointer.isDown && time >= this.nextFireAt) this.fire(angle, time);

    this.player.showInvulnerable(this.store.isPlayerInvulnerable(time), time);
    this.store.setPlayerPos({ x: Math.round(this.player.x), y: Math.round(this.player.y) });

    this.enemies.update(time, delta);
  }

  private fire(angle: number, time: number): void {
    const b = this.bullets.get(this.player.x, this.player.y) as Projectile | null;
    if (!b) return; // pool exhausted
    const muzzle = PLAYER.radius + 6;
    const x = this.player.x + Math.cos(angle) * muzzle;
    const y = this.player.y + Math.sin(angle) * muzzle;
    b.fire(x, y, angle, time);
    this.nextFireAt = time + PLAYER.fireCooldownMs;
    bus.emit('projectileFired', { pos: { x, y }, angle });
  }

  /** arena border + a few pillars to collide with and path around */
  private buildWalls(): void {
    this.walls = this.physics.add.staticGroup();
    const T = WALL_THICKNESS;
    const solid = (x: number, y: number, w: number, h: number) => {
      const wall = this.add.tileSprite(x, y, w, h, TextureKeys.wall).setOrigin(0);
      this.physics.add.existing(wall, true);
      this.walls.add(wall);
    };
    solid(0, 0, GAME_WIDTH, T);
    solid(0, GAME_HEIGHT - T, GAME_WIDTH, T);
    solid(0, T, T, GAME_HEIGHT - T * 2);
    solid(GAME_WIDTH - T, T, T, GAME_HEIGHT - T * 2);

    const pillar = 64;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    for (const [dx, dy] of [[-220, -140], [220, -140], [-220, 140], [220, 140]]) {
      solid(cx + dx - pillar / 2, cy + dy - pillar / 2, pillar, pillar);
    }
  }

  private bindInput(): void {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({
      up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT,
      w: K.W, a: K.A, s: K.S, d: K.D, esc: K.ESC, r: K.R,
    }) as Keys;
    this.input.mouse?.disableContextMenu();

    // Fallback controls until UI and game flow owns these (see AUTO_START).
    if (AUTO_START) {
      this.keys.esc.on('down', () =>
        bus.emit(this.store.state.status === 'paused' ? 'requestResume' : 'requestPause', {}),
      );
      this.keys.r.on('down', () => {
        if (this.store.state.status === 'gameover') bus.emit('requestRestart', {});
      });
    }
  }

  private bindBus(): void {
    this.unsubs.push(
      bus.on('requestStart', () => {
        if (this.store.state.status === 'menu') this.restart();
      }),
      bus.on('requestPause', () => this.store.setStatus('paused')),
      bus.on('requestResume', () => {
        if (this.store.state.status === 'paused') this.store.setStatus('playing');
      }),
      bus.on('requestRestart', () => this.restart()),
      bus.on('waveStarted', ({ wave }) => this.store.setWave(wave)),
      bus.on('statusChanged', () => this.applyStatus()),
    );
  }

  private restart(): void {
    this.bullets.getChildren().forEach((b) => (b as Projectile).kill());
    this.store.startRun();
    this.enemies.reset(); // after startRun so the new 'waveStarted' sticks
    const spawn = this.store.state.player.pos;
    this.player.setPosition(spawn.x, spawn.y).setVelocity(0, 0).clearTint().setAlpha(1);
  }

  /** freeze / unfreeze physics to match status */
  private applyStatus(): void {
    const status = this.store.state.status;
    if (status === 'playing') {
      this.physics.resume();
      this.player.clearTint();
    } else {
      this.physics.pause();
      if (status === 'gameover') this.player.setTint(0x555555).setAlpha(1);
    }
  }
}
