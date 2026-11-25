# nsemble arena: interface contracts (Phase 0, drafted by Core engine)

Every part talks to the others **only** through `src/contracts/`. Change a contract there
first, then post the change in the nsemble session so every agent picks it up.

## Folder layout

| Path | Owner | What lives there |
|---|---|---|
| `src/contracts/` | shared | `GameState`, event map, `EnemySystem`, asset/scene keys |
| `src/core/` | Engine (Omar) | `EventBus` (`bus`), `GameStateStore`, `getStore(scene)` |
| `src/scenes/` | Engine (Omar) | `BootScene`, `GameScene` (loop, input, shooting) |
| `src/entities/`, `src/systems/` | Engine (Omar) | `Player`, `Projectile`, `CollisionSystem` |
| `src/enemies/` | Enemies (Archer) | `createEnemySystem()` in `index.ts` (placeholder chaser for now) |
| `src/ui/` | UI and flow (Luke) | `uiScenes` array in `index.ts` |
| `src/assets/` + `public/` | Assets (Mason) | `preloadAssets(scene)` in `preload.ts` |

## GameState (read-only outside the engine)

```ts
status: 'boot' | 'menu' | 'playing' | 'paused' | 'gameover'
score, kills, wave, elapsedMs
player: { pos, hp, maxHp, speed, invulnerableUntil }
```
Read it with `getStore(this).state`. Only `GameStateStore` writes it.

## Event bus (`import { bus } from 'src/core/EventBus'`)

| Event | Emitted by | Payload |
|---|---|---|
| `statusChanged` | engine | `{ from, to }` |
| `playerMoved` / `playerDamaged` / `playerHealed` / `playerDied` | engine | see `events.ts` |
| `projectileFired` | engine | `{ pos, angle }` |
| `enemyKilled` | engine | `{ enemyId, enemyType, pos, points }` |
| `scoreChanged` | engine | `{ score, delta }` |
| `gameOver` | engine | `{ score, kills, wave, elapsedMs }` |
| `waveStarted` / `waveCleared` | enemies | `{ wave, enemyCount }` / `{ wave }` |
| `requestStart` / `requestPause` / `requestResume` / `requestRestart` | UI | `{}` |

## Plug-in points

- **Enemies**: implement `EnemySystem` (`group`, `init(ctx)`, `update`, `reset`). Every sprite in
  `group` is an `EnemyLike`: `enemyId`, `enemyType`, `contactDamage`, `points`, `takeHit(n) => killed`.
  The engine handles bullet hits, contact damage, kills and score. Don't destroy a body mid-step:
  `disableBody` first, destroy next tick.
- **UI**: add scenes to `uiScenes`, read state, emit `request*`. Set `AUTO_START = false` in
  `config.ts` when your menu lands; until then the engine auto-starts and binds Esc (pause) and R (restart).
- **Assets**: load files under `TextureKeys` / `SoundKeys`. Anything missing gets a generated
  placeholder, so the game always runs.

## Controls (engine)

WASD / arrows to move, mouse to aim, hold left click to shoot.
