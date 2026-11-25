import type { EnemySystemFactory } from '../contracts/systems';
import { PlaceholderEnemySystem } from './PlaceholderEnemySystem';

/**
 * OWNER: Enemies and AI (Archer). Point this at your real EnemySystem.
 * The engine only ever calls createEnemySystem().
 */
export const createEnemySystem: EnemySystemFactory = () => new PlaceholderEnemySystem();
