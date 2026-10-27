import { describe, it, expect } from 'vitest';
import {
  rollD6,
  rollD3,
  calculateDamage,
  rollEnemy,
  rollLootItem,
  rollChestItems,
  createInitialState,
  enterDarkWood,
  startNextEncounter,
  lightLamp,
  proceedFromRest,
  proceedFromPause,
  fightEncounter,
  fleeCombat,
  playerStrike,
  continueAfterPlayerStrike,
  continueAfterEnemyTurn,
  proceedFromCombat,
  cycleChestItem,
  takeChestItem,
  leaveChest,
  restartGame,
  STARTING_WEAPON,
  BESTIARY,
  LOOT_TABLE,
  PAUSE_MESSAGES,
} from './engine';

// Helper to create a deterministic sequence of rolls from [0, 1) values or D6/D3 targets
function createMockRng(values: number[]) {
  let index = 0;
  return () => {
    const val = values[index % values.length];
    index++;
    return val;
  };
}

// Helper to convert 1-based die result (out of sides) into a [0, 1) float
function dieToFloat(face: number, sides: number): number {
  return (face - 0.5) / sides;
}

describe('Engine - Core Math & Dice Formulas', () => {
  it('rollD6 returns integers from 1 to 6 uniformly', () => {
    expect(rollD6(() => 0.0)).toBe(1);
    expect(rollD6(() => 0.16)).toBe(1);
    expect(rollD6(() => 0.17)).toBe(2);
    expect(rollD6(() => 0.5)).toBe(4);
    expect(rollD6(() => 0.999)).toBe(6);
  });

  it('rollD3 returns integers from 1 to 3 uniformly', () => {
    expect(rollD3(() => 0.0)).toBe(1);
    expect(rollD3(() => 0.33)).toBe(1);
    expect(rollD3(() => 0.34)).toBe(2);
    expect(rollD3(() => 0.67)).toBe(3);
    expect(rollD3(() => 0.999)).toBe(3);
  });

  it('calculateDamage reduces weapon damage by floor(toughness / 2) with minimum 1', () => {
    // Toughness 1 -> -0 dmg
    expect(calculateDamage(2, 1)).toBe(2);
    expect(calculateDamage(1, 1)).toBe(1);
    // Toughness 2 -> -1 dmg
    expect(calculateDamage(2, 2)).toBe(1);
    expect(calculateDamage(3, 2)).toBe(2);
    // Toughness 3 -> -1 dmg
    expect(calculateDamage(3, 3)).toBe(2);
    expect(calculateDamage(5, 3)).toBe(4);
    // Toughness 4 -> -2 dmg
    expect(calculateDamage(4, 4)).toBe(2);
    expect(calculateDamage(2, 4)).toBe(1); // minimum 1 damage
    expect(calculateDamage(1, 10)).toBe(1); // minimum 1 damage even against high toughness
  });
});

describe('Engine - Bestiary & Loot Tables', () => {
  it('has accurate starting weapon and data tables', () => {
    expect(STARTING_WEAPON).toEqual({
      name: 'Rusty Dagger',
      skill: 3,
      damage: 2,
      desc: 'A tarnished but sharp blade.',
    });
    expect(BESTIARY.rat.maxHp).toBe(2);
    expect(BESTIARY.rat.toughness).toBe(1);
    expect(BESTIARY.zombie.maxHp).toBe(4);
    expect(BESTIARY.zombie.toughness).toBe(1);
    expect(BESTIARY.wolf.maxHp).toBe(6);
    expect(BESTIARY.wolf.toughness).toBe(1);
    expect(BESTIARY.spider.maxHp).toBe(8);
    expect(BESTIARY.spider.toughness).toBe(2);
    expect(LOOT_TABLE).toHaveLength(6);
  });

  it('rollEnemy maps D6 rolls to the correct enemy types', () => {
    expect(rollEnemy(() => dieToFloat(1, 6)).type).toBe('rat');
    expect(rollEnemy(() => dieToFloat(2, 6)).type).toBe('zombie');
    expect(rollEnemy(() => dieToFloat(3, 6)).type).toBe('zombie');
    expect(rollEnemy(() => dieToFloat(4, 6)).type).toBe('wolf');
    expect(rollEnemy(() => dieToFloat(5, 6)).type).toBe('wolf');
    expect(rollEnemy(() => dieToFloat(6, 6)).type).toBe('spider');
  });

  it('rollLootItem maps D6 rolls 1..6 to the 6 loot table items', () => {
    expect(rollLootItem(() => dieToFloat(1, 6)).name).toBe('Elixir of Life');
    expect(rollLootItem(() => dieToFloat(2, 6)).name).toBe('Spiked Club');
    expect(rollLootItem(() => dieToFloat(3, 6)).name).toBe('Hunting Spear');
    expect(rollLootItem(() => dieToFloat(4, 6)).name).toBe('Broadsword');
    expect(rollLootItem(() => dieToFloat(5, 6)).name).toBe('Silver Rapier');
    expect(rollLootItem(() => dieToFloat(6, 6)).name).toBe('Double Draught');
  });

  it('rollChestItems always generates exactly 1 item per chest', () => {
    const items1 = rollChestItems(() => dieToFloat(1, 6));
    expect(items1).toHaveLength(1);
    expect(items1[0].name).toBe('Elixir of Life');

    const items2 = rollChestItems(() => dieToFloat(4, 6));
    expect(items2).toHaveLength(1);
    expect(items2[0].name).toBe('Broadsword');
  });
});

describe('Engine - State Transitions', () => {
  it('createInitialState sets up title screen with 13 HP, 0 lamps, and Rusty Dagger', () => {
    const state = createInitialState();
    expect(state.screen).toBe('title');
    expect(state.hp).toBe(13);
    expect(state.maxHp).toBe(13);
    expect(state.lamps).toBe(0);
    expect(state.weapon.name).toBe('Rusty Dagger');
    expect(state.weapon.skill).toBe(3);
    expect(state.weapon.damage).toBe(2);
  });

  it('enterDarkWood transitions to first enemy encounter (50% Dire Rat, 50% Zombie)', () => {
    const initial = createInitialState();

    const stateRat = enterDarkWood(initial, () => 0.25);
    expect(stateRat.screen).toBe('enemy');
    expect(stateRat.combat?.enemy.type).toBe('rat');
    expect(stateRat.combat?.phase).toBe('encounter');

    const stateZombie = enterDarkWood(initial, () => 0.75);
    expect(stateZombie.screen).toBe('enemy');
    expect(stateZombie.combat?.enemy.type).toBe('zombie');
    expect(stateZombie.combat?.phase).toBe('encounter');
  });

  it('startNextEncounter rolls D6: 1 -> lamp, 2 -> pause, 3-5 -> enemy, 6 -> chest', () => {
    const base = createInitialState();

    // Roll 1 -> lamp
    const lampState = startNextEncounter(base, () => dieToFloat(1, 6));
    expect(lampState.screen).toBe('lamp');

    // Roll 2 -> pause (with message from PAUSE_MESSAGES)
    const pauseRng = createMockRng([dieToFloat(2, 6), 0]);
    const pauseState = startNextEncounter(base, pauseRng);
    expect(pauseState.screen).toBe('pause');
    expect(PAUSE_MESSAGES).toContain(pauseState.pauseMessage);
    expect(PAUSE_MESSAGES.length).toBeGreaterThanOrEqual(15);
    expect(PAUSE_MESSAGES.length).toBeLessThanOrEqual(20);

    // Roll 4 -> enemy, then roll 6 -> spider
    const enemyRng = createMockRng([dieToFloat(4, 6), dieToFloat(6, 6)]);
    const enemyState = startNextEncounter(base, enemyRng);
    expect(enemyState.screen).toBe('enemy');
    expect(enemyState.combat?.enemy.type).toBe('spider');
    expect(enemyState.combat?.phase).toBe('encounter');

    // Roll 6 -> chest (1 item: Broadsword)
    const chestRng = createMockRng([dieToFloat(6, 6), dieToFloat(4, 6)]);
    const chestState = startNextEncounter(base, chestRng);
    expect(chestState.screen).toBe('chest');
    expect(chestState.chest?.items).toHaveLength(1);
    expect(chestState.chest?.items[0].name).toBe('Broadsword');
    expect(chestState.chest?.message).toBe(
      'An ancient ironbound coffer rests among the twisted roots.'
    );
  });

  it('lightLamp increments lamps, heals +D3 HP (capped at maxHp), and goes to rest screen', () => {
    const state = {
      ...createInitialState(),
      screen: 'lamp' as const,
      hp: 9,
      lamps: 3,
    };
    const next = lightLamp(state, () => dieToFloat(3, 3)); // heals +3
    expect(next.screen).toBe('rest');
    expect(next.lamps).toBe(4);
    expect(next.hp).toBe(12);
    expect(next.restHeal).toBe(3);
  });

  it('lightLamp caps healing at maxHp (13)', () => {
    const state = {
      ...createInitialState(),
      screen: 'lamp' as const,
      hp: 12,
      lamps: 0,
    };
    const next = lightLamp(state, () => dieToFloat(3, 3)); // rolls 3, capped at 13
    expect(next.hp).toBe(13);
    expect(next.restHeal).toBe(3);
  });

  it('lightLamp transitions immediately to victory when 10th lamp is lit', () => {
    const state = {
      ...createInitialState(),
      screen: 'lamp' as const,
      hp: 8,
      lamps: 9,
    };
    const next = lightLamp(state, () => dieToFloat(2, 3));
    expect(next.screen).toBe('victory');
    expect(next.lamps).toBe(10);
  });

  it('proceedFromRest calls startNextEncounter', () => {
    const state = {
      ...createInitialState(),
      screen: 'rest' as const,
    };
    const next = proceedFromRest(state, () => dieToFloat(1, 6));
    expect(next.screen).toBe('lamp');
  });

  it('proceedFromPause calls startNextEncounter', () => {
    const state = {
      ...createInitialState(),
      screen: 'pause' as const,
    };
    const next = proceedFromPause(state, () => dieToFloat(1, 6));
    expect(next.screen).toBe('lamp');
  });
});

describe('Engine - Combat Mechanics', () => {
  it('fightEncounter: player wins priority (re-rolling ties) -> player_turn', () => {
    const initial = enterDarkWood(createInitialState(), () => 0.1); // Dire Rat
    // Tie (4 vs 4), then Player 5 vs Enemy 2
    const rng = createMockRng([
      dieToFloat(4, 6),
      dieToFloat(4, 6),
      dieToFloat(5, 6),
      dieToFloat(2, 6),
    ]);
    const next = fightEncounter(initial, rng);
    expect(next.combat?.phase).toBe('player_turn');
    expect(next.combat?.playerPriorityRoll).toBe(5);
    expect(next.combat?.enemyPriorityRoll).toBe(2);
    expect(next.combat?.playerWinsPriority).toBe(true);
    expect(next.combat?.logMessage).toContain('Initiative won! (You: 5 vs Enemy: 2)');
  });

  it('fightEncounter: enemy wins priority and misses -> enemy_turn_result', () => {
    const initial = enterDarkWood(createInitialState(), () => 0.1); // Dire Rat (skill 4+, dmg 1)
    // Player 2 vs Enemy 5, then Enemy attack roll 2 (miss)
    const rng = createMockRng([
      dieToFloat(2, 6),
      dieToFloat(5, 6),
      dieToFloat(2, 6),
    ]);
    const next = fightEncounter(initial, rng);
    expect(next.combat?.phase).toBe('enemy_turn_result');
    expect(next.combat?.playerWinsPriority).toBe(false);
    expect(next.combat?.lastEnemyRoll).toBe(2);
    expect(next.combat?.enemyHit).toBe(false);
    expect(next.hp).toBe(13);
  });

  it('fightEncounter: enemy wins priority, hits player, and can trigger game_over if HP reaches 0', () => {
    const initial = {
      ...enterDarkWood(createInitialState(), () => 0.1), // Dire Rat (skill 4+, dmg 1)
      hp: 1,
    };
    // Player 1 vs Enemy 6, then Enemy attack roll 5 (hit for 1 dmg)
    const rng = createMockRng([
      dieToFloat(1, 6),
      dieToFloat(6, 6),
      dieToFloat(5, 6),
    ]);
    const next = fightEncounter(initial, rng);
    expect(next.screen).toBe('game_over');
    expect(next.hp).toBe(0);
    expect(next.deathCause).toBe('Slain by Dire Rat');
  });

  it('fleeCombat: if lamps > 0, extinguishes 1 lit lamp without HP loss; if lamps == 0, inflicts D3 HP damage (or game_over at 0 HP)', () => {
    const initialWithLamps = {
      ...enterDarkWood(createInitialState(), () => 0.1), // Dire Rat
      lamps: 3,
      hp: 10,
    };
    const fledLampState = fleeCombat(initialWithLamps, () => dieToFloat(3, 3));
    expect(fledLampState.screen).toBe('enemy');
    expect(fledLampState.combat?.phase).toBe('fled');
    expect(fledLampState.lamps).toBe(2);
    expect(fledLampState.hp).toBe(10);
    expect(fledLampState.combat?.fleeDamage).toBeUndefined();
    expect(fledLampState.combat?.logMessage).toMatch(/lamp goes out/i);

    const zeroLampState = { ...initialWithLamps, lamps: 0, hp: 10 };
    const fledDamageState = fleeCombat(zeroLampState, () => dieToFloat(2, 3)); // 2 damage
    expect(fledDamageState.screen).toBe('enemy');
    expect(fledDamageState.combat?.phase).toBe('fled');
    expect(fledDamageState.lamps).toBe(0);
    expect(fledDamageState.hp).toBe(8);
    expect(fledDamageState.combat?.fleeDamage).toBe(2);
    expect(fledDamageState.combat?.logMessage).toMatch(/taking 2 damage/i);

    const doomedZeroLampState = { ...initialWithLamps, lamps: 0, hp: 2 };
    const deadState = fleeCombat(doomedZeroLampState, () => dieToFloat(3, 3)); // 3 damage -> 0 HP
    expect(deadState.screen).toBe('game_over');
    expect(deadState.hp).toBe(0);
    expect(deadState.deathCause).toBe('Felled while escaping Dire Rat');
  });

  it('playerStrike: hits and kills enemy -> recovers D3 HP and transitions to enemy_defeated', () => {
    const initial = {
      ...enterDarkWood(createInitialState(), () => 0.1), // Dire Rat (2 HP, Toughness 1)
      hp: 8,
    };
    // Rusty Dagger: skill 3+, damage 2 -> deals 2 dmg to Rat -> kills Rat in 1 hit!
    // Roll 4 to hit, then roll 3 on D3 for heal
    const rng = createMockRng([dieToFloat(4, 6), dieToFloat(3, 3)]);
    const next = playerStrike(initial, rng);
    expect(next.combat?.phase).toBe('enemy_defeated');
    expect(next.combat?.lastPlayerRoll).toBe(4);
    expect(next.combat?.playerHit).toBe(true);
    expect(next.combat?.playerDamageDealt).toBe(2);
    expect(next.combat?.enemy.hp).toBe(0);
    expect(next.combat?.healAmount).toBe(3);
    expect(next.hp).toBe(11);
  });

  it('playerStrike: hits non-fatally -> transitions to player_strike_result', () => {
    const initial = enterDarkWood(createInitialState(), () => 0.8); // Zombie (4 HP, Toughness 1)
    // Rusty Dagger: damage 2 vs Toughness 1 -> 2 damage dealt, 2 HP left
    const next = playerStrike(initial, () => dieToFloat(3, 6));
    expect(next.combat?.phase).toBe('player_strike_result');
    expect(next.combat?.playerHit).toBe(true);
    expect(next.combat?.playerDamageDealt).toBe(2);
    expect(next.combat?.enemy.hp).toBe(2);
  });

  it('playerStrike: misses -> transitions to player_strike_result with 0 damage', () => {
    const initial = enterDarkWood(createInitialState(), () => 0.8); // Zombie
    const next = playerStrike(initial, () => dieToFloat(2, 6)); // needs 3+
    expect(next.combat?.phase).toBe('player_strike_result');
    expect(next.combat?.playerHit).toBe(false);
    expect(next.combat?.playerDamageDealt).toBe(0);
    expect(next.combat?.enemy.hp).toBe(4);
  });

  it('continueAfterPlayerStrike triggers enemy counter-attack and transitions to enemy_turn_result or game_over', () => {
    const initial = playerStrike(
      enterDarkWood(createInitialState(), () => 0.8), // Zombie (skill 4+, dmg 2)
      () => dieToFloat(3, 6)
    );
    // Zombie rolls 5 -> hits for 2 dmg
    const afterEnemy = continueAfterPlayerStrike(initial, () => dieToFloat(5, 6));
    expect(afterEnemy.combat?.phase).toBe('enemy_turn_result');
    expect(afterEnemy.combat?.lastEnemyRoll).toBe(5);
    expect(afterEnemy.combat?.enemyHit).toBe(true);
    expect(afterEnemy.combat?.enemyDamageDealt).toBe(2);
    expect(afterEnemy.hp).toBe(11);

    // Next continue goes back to player_turn
    const backToPlayer = continueAfterEnemyTurn(afterEnemy);
    expect(backToPlayer.combat?.phase).toBe('player_turn');
  });

  it('proceedFromCombat starts next encounter', () => {
    const initial = enterDarkWood(createInitialState(), () => 0.1);
    const next = proceedFromCombat(initial, () => dieToFloat(1, 6));
    expect(next.screen).toBe('lamp');
  });
});

describe('Engine - Chest Mechanics', () => {
  it('cycleChestItem keeps selection on the single chest item', () => {
    const chestRng = createMockRng([dieToFloat(6, 6), dieToFloat(4, 6)]);
    const state = startNextEncounter(createInitialState(), chestRng);
    expect(state.chest?.items).toHaveLength(1);
    expect(state.chest?.selectedIndex).toBe(0);

    const cycled1 = cycleChestItem(state);
    expect(cycled1.chest?.selectedIndex).toBe(0);
  });

  it('takeChestItem applies potion healing or weapon equip and immediately exits the 1-item chest', () => {
    // 1st chest: Elixir of Life (+3 HP)
    const potionChestRng = createMockRng([dieToFloat(6, 6), dieToFloat(1, 6)]);
    const potionState = {
      ...startNextEncounter(createInitialState(), potionChestRng),
      hp: 8,
    };
    const afterPotion = takeChestItem(potionState, 0, () => dieToFloat(1, 6));
    expect(afterPotion.hp).toBe(11);
    expect(afterPotion.screen).toBe('lamp');

    // 2nd chest: Broadsword (4+, 5 dmg)
    const weaponChestRng = createMockRng([dieToFloat(6, 6), dieToFloat(4, 6)]);
    const weaponState = startNextEncounter(createInitialState(), weaponChestRng);
    const afterWeapon = takeChestItem(weaponState, 0, () => dieToFloat(1, 6));
    expect(afterWeapon.weapon.name).toBe('Broadsword');
    expect(afterWeapon.weapon.damage).toBe(5);
    expect(afterWeapon.screen).toBe('lamp');
  });

  it('leaveChest immediately transitions to next encounter', () => {
    const chestRng = createMockRng([dieToFloat(6, 6), dieToFloat(1, 6)]);
    const state = startNextEncounter(createInitialState(), chestRng);
    const next = leaveChest(state, () => dieToFloat(2, 6));
    expect(next.screen).toBe('pause');
  });

  it('restartGame resets to initial title state', () => {
    const reset = restartGame();
    expect(reset.screen).toBe('title');
    expect(reset.hp).toBe(13);
    expect(reset.lamps).toBe(0);
  });
});
