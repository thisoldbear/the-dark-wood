export interface Weapon {
  name: string;
  skill: number; // Roll >= skill to hit (e.g., 3 means 3+)
  damage: number;
  desc: string;
}

export type EnemyType = "rat" | "zombie" | "wolf" | "spider";

export interface Enemy {
  name: string;
  type: EnemyType;
  maxHp: number;
  hp: number;
  toughness: number;
  skill: number;
  damage: number;
  desc: string;
}

export type ItemType = "potion" | "weapon" | "double_potion";

export interface Item {
  name: string;
  type: ItemType;
  heal?: number;
  weapon?: Weapon;
  desc: string;
}

export type CombatPhase =
  | "encounter"
  | "player_turn"
  | "player_strike_result"
  | "enemy_turn_result"
  | "enemy_defeated"
  | "fled";

export interface CombatState {
  enemy: Enemy;
  phase: CombatPhase;
  playerPriorityRoll?: number;
  enemyPriorityRoll?: number;
  playerWinsPriority?: boolean;
  lastPlayerRoll?: number;
  playerHit?: boolean;
  playerDamageDealt?: number;
  lastEnemyRoll?: number;
  enemyHit?: boolean;
  enemyDamageDealt?: number;
  fleeDamage?: number;
  healAmount?: number;
  logMessage: string;
}

export interface ChestState {
  items: Item[];
  selectedIndex: number;
  message: string;
}

export type GameScreen =
  | 'title'
  | 'lamp'
  | 'rest'
  | 'enemy'
  | 'chest'
  | 'pause'
  | 'victory'
  | 'game_over';

export interface GameState {
  screen: GameScreen;
  hp: number;
  maxHp: number;
  lamps: number;
  weapon: Weapon;
  combat?: CombatState;
  chest?: ChestState;
  pauseMessage?: string;
  stepsSincePause?: number;
  restHeal?: number;
  deathCause?: string;
}

export type Rng = () => number; // Returns a number in [0, 1)
