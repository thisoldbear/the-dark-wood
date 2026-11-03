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
  takeChestItem,
  takeAllChestItems,
  openChest,
  unlockChest,
  leaveChest,
  applyInventoryItem,
  discardInventoryItem,
  getWeighedDownPenalty,
  isWeighedDown,
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

  it('rollChestItems generates 1 to 3 items using rollD3', () => {
    // 1 item: count roll 1 (dieToFloat(1, 3)), then item roll 4 (Broadsword)
    const rng1 = createMockRng([dieToFloat(1, 3), dieToFloat(4, 6)]);
    const items1 = rollChestItems(rng1);
    expect(items1).toHaveLength(1);
    expect(items1[0].name).toBe('Broadsword');

    // 3 items: count roll 3, then 3 item rolls
    const rng3 = createMockRng([
      dieToFloat(3, 3),
      dieToFloat(1, 6),
      dieToFloat(2, 6),
      dieToFloat(3, 6),
    ]);
    const items3 = rollChestItems(rng3);
    expect(items3).toHaveLength(3);
    expect(items3.map((i) => i.name)).toEqual([
      'Elixir of Life',
      'Spiked Club',
      'Hunting Spear',
    ]);
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

  it('startNextEncounter rolls D6: 1-2 -> lamp, 3-5 -> enemy, 6 -> chest when not at pause interval', () => {
    const base = createInitialState();

    // Roll 1 -> lamp
    const lampState = startNextEncounter(base, () => dieToFloat(1, 6));
    expect(lampState.screen).toBe('lamp');
    expect(lampState.stepsSincePause).toBe(1);

    // Roll 2 -> lamp
    const lampState2 = startNextEncounter(base, () => dieToFloat(2, 6));
    expect(lampState2.screen).toBe('lamp');

    // Roll 4 -> enemy, then roll 6 -> spider
    const enemyRng = createMockRng([dieToFloat(4, 6), dieToFloat(6, 6)]);
    const enemyState = startNextEncounter(base, enemyRng);
    expect(enemyState.screen).toBe('enemy');
    expect(enemyState.combat?.enemy.type).toBe('spider');
    expect(enemyState.combat?.phase).toBe('encounter');

    // Roll 6 -> chest (not locked roll: 1, 1 item: count roll 1, Broadsword roll: 4)
    const chestRng = createMockRng([
      dieToFloat(6, 6),
      dieToFloat(1, 6),
      dieToFloat(1, 3),
      dieToFloat(4, 6),
    ]);
    const chestState = startNextEncounter(base, chestRng);
    expect(chestState.screen).toBe('chest');
    expect(chestState.chest?.isLocked).toBe(false);
    expect(chestState.chest?.opened).toBe(false);
    expect(chestState.chest?.items).toHaveLength(1);
    expect(chestState.chest?.items[0].name).toBe('Broadsword');
    expect(chestState.chest?.message).toBe(
      'An ancient ironbound coffer rests among the twisted roots.'
    );

    // Roll 6 -> locked chest (locked roll: 6, locked item: Dragonfang Blade roll: 2)
    const lockedRng = createMockRng([dieToFloat(6, 6), dieToFloat(6, 6), dieToFloat(2, 6)]);
    const lockedState = startNextEncounter(base, lockedRng);
    expect(lockedState.screen).toBe('chest');
    expect(lockedState.chest?.isLocked).toBe(true);
    expect(lockedState.chest?.opened).toBe(false);
    expect(lockedState.chest?.items[0].name).toBe('Dragonfang Blade');
  });

  it('startNextEncounter deterministically triggers a pause/respite every 4 encounters and resets counter', () => {
    const base = createInitialState();
    // 3 steps
    const step1 = startNextEncounter(base, () => dieToFloat(1, 6));
    expect(step1.screen).toBe('lamp');
    expect(step1.stepsSincePause).toBe(1);

    const step2 = startNextEncounter(step1, () => dieToFloat(3, 6));
    expect(step2.screen).toBe('enemy');
    expect(step2.stepsSincePause).toBe(2);

    const step3 = startNextEncounter(step2, () => dieToFloat(6, 6));
    expect(step3.screen).toBe('chest');
    expect(step3.stepsSincePause).toBe(3);

    // Step 4: reaches PAUSE_INTERVAL -> deterministic respite pause!
    const step4 = startNextEncounter(step3);
    expect(step4.screen).toBe('pause');
    expect(step4.stepsSincePause).toBe(0);
    expect(PAUSE_MESSAGES).toContain(step4.pauseMessage);
    expect(PAUSE_MESSAGES.length).toBeGreaterThanOrEqual(15);
    expect(PAUSE_MESSAGES.length).toBeLessThanOrEqual(20);

    // Next step after pause continues regular encounters
    const step5 = proceedFromPause(step4, () => dieToFloat(1, 6));
    expect(step5.screen).toBe('lamp');
    expect(step5.stepsSincePause).toBe(1);
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
  it('openChest opens an unlocked chest', () => {
    const state = {
      ...createInitialState(),
      screen: 'chest' as const,
      chest: {
        items: [{ name: 'Elixir of Life', type: 'potion' as const, heal: 3, desc: 'Restores +3 HP.' }],
        selectedIndex: 0,
        message: 'An ancient ironbound coffer rests among the twisted roots.',
        isLocked: false,
        opened: false,
      },
    };
    const opened = openChest(state);
    expect(opened.chest?.opened).toBe(true);
  });

  it('unlockChest rolls D6: opens on 5+, deals 1 trap damage on 1-4', () => {
    const lockedState = {
      ...createInitialState(),
      screen: 'chest' as const,
      hp: 5,
      chest: {
        items: [{ name: 'Dragonfang Blade', type: 'weapon' as const, desc: 'Wyrm blade.' }],
        selectedIndex: 0,
        message: 'Locked coffer.',
        isLocked: true,
        opened: false,
      },
    };

    // Failed unlock (roll 3): takes 1 damage, stays locked
    const failed = unlockChest(lockedState, () => dieToFloat(3, 6));
    expect(failed.hp).toBe(4);
    expect(failed.chest?.opened).toBe(false);
    expect(failed.chest?.unlockFailed).toBe(true);
    expect(failed.chest?.lastUnlockRoll).toBe(3);

    // Lethal failed unlock at 1 HP: triggers game_over
    const lethalState = { ...lockedState, hp: 1 };
    const dead = unlockChest(lethalState, () => dieToFloat(2, 6));
    expect(dead.hp).toBe(0);
    expect(dead.screen).toBe('game_over');
    expect(dead.deathCause).toMatch(/needle trap/i);

    // Successful unlock (roll 5): opens chest
    const success = unlockChest(lockedState, () => dieToFloat(5, 6));
    expect(success.hp).toBe(5);
    expect(success.chest?.opened).toBe(true);
    expect(success.chest?.unlockFailed).toBe(false);
    expect(success.chest?.lastUnlockRoll).toBe(5);
  });

  it('takeChestItem stows items into inventory without auto-using, and duplicates each take a slot', () => {
    const state = {
      ...createInitialState(),
      screen: 'chest' as const,
      hp: 8,
      inventory: [],
      chest: {
        items: [
          { name: 'Elixir of Life', type: 'potion' as const, heal: 3, desc: 'Restores +3 HP.' },
          { name: 'Elixir of Life', type: 'potion' as const, heal: 3, desc: 'Restores +3 HP.' },
        ],
        selectedIndex: 0,
        message: 'Loot',
        opened: true,
      },
    };

    const afterFirst = takeChestItem(state, 0);
    expect(afterFirst.inventory).toHaveLength(1);
    expect(afterFirst.inventory[0].name).toBe('Elixir of Life');
    expect(afterFirst.chest?.items).toHaveLength(1);
    expect(afterFirst.hp).toBe(8); // Did not auto-drink!

    const afterSecond = takeChestItem(afterFirst, 0);
    expect(afterSecond.inventory).toHaveLength(2);
    expect(afterSecond.inventory[0].name).toBe('Elixir of Life');
    expect(afterSecond.inventory[1].name).toBe('Elixir of Life');
    expect(afterSecond.chest?.items).toHaveLength(0);
  });

  it('takeAllChestItems stows all items into inventory', () => {
    const state = {
      ...createInitialState(),
      screen: 'chest' as const,
      inventory: [],
      chest: {
        items: [
          { name: 'Broadsword', type: 'weapon' as const, desc: 'Steel.' },
          { name: 'Double Draught', type: 'potion' as const, heal: 6, desc: 'Tonic.' },
        ],
        selectedIndex: 0,
        message: 'Loot',
        opened: true,
      },
    };

    const afterAll = takeAllChestItems(state);
    expect(afterAll.inventory).toHaveLength(2);
    expect(afterAll.chest?.items).toHaveLength(0);
  });

  it('leaveChest immediately transitions to next encounter', () => {
    const chestRng = createMockRng([dieToFloat(6, 6), dieToFloat(1, 6), dieToFloat(1, 6)]);
    const state = startNextEncounter(createInitialState(), chestRng);
    const next = leaveChest(state, () => dieToFloat(2, 6));
    expect(next.screen).toBe('lamp');
  });

  it('restartGame resets to initial title state', () => {
    const reset = restartGame();
    expect(reset.screen).toBe('title');
    expect(reset.hp).toBe(13);
    expect(reset.lamps).toBe(0);
    expect(reset.inventory).toEqual([]);
  });
});

describe('Engine - Inventory, Weighed Down & Armor Mechanics', () => {
  it('applyInventoryItem consumes potions instantly and heals player up to maxHp', () => {
    const state = {
      ...createInitialState(),
      hp: 5,
      inventory: [
        { name: 'Elixir of Life', type: 'potion' as const, heal: 3, instant: true, desc: 'Heals 3.' },
        { name: 'Spiked Club', type: 'weapon' as const, desc: 'Club.' },
      ],
    };

    const afterPotion = applyInventoryItem(state, 0);
    expect(afterPotion.hp).toBe(8);
    expect(afterPotion.inventory).toHaveLength(1);
    expect(afterPotion.inventory[0].name).toBe('Spiked Club');
  });

  it('applyInventoryItem equips weapons and swaps the previously equipped weapon into inventory', () => {
    const state = {
      ...createInitialState(),
      weapon: { name: 'Rusty Dagger', skill: 3, damage: 2, desc: 'Old blade.' },
      inventory: [
        {
          name: 'Silver Rapier',
          type: 'weapon' as const,
          weapon: { name: 'Silver Rapier', skill: 3, damage: 4, desc: 'Rapier.' },
          desc: 'Rapier.',
        },
      ],
    };

    const afterEquip = applyInventoryItem(state, 0);
    expect(afterEquip.weapon.name).toBe('Silver Rapier');
    expect(afterEquip.weapon.damage).toBe(4);
    expect(afterEquip.inventory).toHaveLength(1);
    expect(afterEquip.inventory[0].name).toBe('Rusty Dagger');
    expect(afterEquip.inventory[0].weapon?.damage).toBe(2);
  });

  it('applyInventoryItem equips armor and swaps previously equipped armor if present', () => {
    const state = {
      ...createInitialState(),
      armor: undefined,
      inventory: [
        {
          name: 'Mithril Chainmail',
          type: 'armor' as const,
          armor: { name: 'Mithril Chainmail', defense: 1, desc: 'Absorbs 1 dmg.' },
          desc: 'Absorbs 1 dmg.',
        },
      ],
    };

    const equipped = applyInventoryItem(state, 0);
    expect(equipped.armor?.name).toBe('Mithril Chainmail');
    expect(equipped.inventory).toHaveLength(0);

    // Swapping with another armor in pack
    const withSecondArmor = {
      ...equipped,
      inventory: [
        {
          name: 'Runed Aegis',
          type: 'armor' as const,
          armor: { name: 'Runed Aegis', defense: 1, desc: 'Aegis.' },
          desc: 'Aegis.',
        },
      ],
    };
    const swapped = applyInventoryItem(withSecondArmor, 0);
    expect(swapped.armor?.name).toBe('Runed Aegis');
    expect(swapped.inventory[0].name).toBe('Mithril Chainmail');
  });

  it('discardInventoryItem removes the item at specified index', () => {
    const state = {
      ...createInitialState(),
      inventory: [
        { name: 'Item A', type: 'potion' as const, desc: 'A' },
        { name: 'Item B', type: 'weapon' as const, desc: 'B' },
      ],
    };

    const discarded = discardInventoryItem(state, 0);
    expect(discarded.inventory).toHaveLength(1);
    expect(discarded.inventory[0].name).toBe('Item B');
  });

  it('gracefully handles out-of-bounds indices for inventory and chest actions', () => {
    const base = createInitialState();
    expect(applyInventoryItem(base, -1)).toBe(base);
    expect(applyInventoryItem(base, 99)).toBe(base);
    expect(discardInventoryItem(base, -1)).toBe(base);
    expect(discardInventoryItem(base, 99)).toBe(base);
    expect(takeChestItem(base, 0)).toBe(base);
    expect(takeAllChestItems(base)).toBe(base);
  });

  it('isWeighedDown flags true only when total carried items (including equipped weapon) > 3', () => {
    expect(isWeighedDown([])).toBe(false);
    expect(
      isWeighedDown([
        { name: '1', type: 'potion', desc: '' },
        { name: '2', type: 'potion', desc: '' },
      ])
    ).toBe(false);
    expect(
      isWeighedDown([
        { name: '1', type: 'potion', desc: '' },
        { name: '2', type: 'potion', desc: '' },
        { name: '3', type: 'potion', desc: '' },
      ])
    ).toBe(true);
  });

  it('getWeighedDownPenalty calculates +1 penalty for every 1 item over the limit of 3', () => {
    expect(getWeighedDownPenalty([])).toBe(0); // 1 carried (weapon)
    expect(
      getWeighedDownPenalty([
        { name: '1', type: 'potion', desc: '' },
        { name: '2', type: 'potion', desc: '' },
      ])
    ).toBe(0); // 3 carried -> 0 over limit
    expect(
      getWeighedDownPenalty([
        { name: '1', type: 'potion', desc: '' },
        { name: '2', type: 'potion', desc: '' },
        { name: '3', type: 'potion', desc: '' },
      ])
    ).toBe(1); // 4 carried -> 1 over limit
    expect(
      getWeighedDownPenalty([
        { name: '1', type: 'potion', desc: '' },
        { name: '2', type: 'potion', desc: '' },
        { name: '3', type: 'potion', desc: '' },
        { name: '4', type: 'potion', desc: '' },
      ])
    ).toBe(2); // 5 carried -> 2 over limit
  });

  it('weighed down status scales penalty: each item over limit makes enemy hit 1+ easier and player strike require 1+ more', () => {
    // Rat has skill 4 (normally hits on 4+).
    // Player has Rusty Dagger with skill 3 (normally hits on 3+).
    const normalState = {
      ...enterDarkWood(createInitialState(), () => 0.1), // Rat (hp 2, toughness 1, skill 4, damage 1)
      inventory: [],
    };
    normalState.combat!.phase = 'player_turn';

    // Player strikes with roll of 3 (normally hits on 3+)
    const strikeNormal = playerStrike(normalState, () => dieToFloat(3, 6));
    expect(strikeNormal.combat?.playerHit).toBe(true);

    // Weighed down state (+1 penalty: 3 pack items + 1 equipped weapon = 4 carried items, 1 over limit)
    const weighedState1 = {
      ...normalState,
      inventory: [
        { name: '1', type: 'potion' as const, desc: '' },
        { name: '2', type: 'potion' as const, desc: '' },
        { name: '3', type: 'potion' as const, desc: '' },
      ],
    };
    // Player strike with roll of 3: now needs 3+1 = 4+, so 3 misses!
    const strikeWeighed1 = playerStrike(weighedState1, () => dieToFloat(3, 6));
    expect(strikeWeighed1.combat?.playerHit).toBe(false);

    // Enemy attack counter: normally roll 3 misses vs skill 4. With +1 penalty, enemy hits on 3+!
    const enemyAttackWeighed1 = continueAfterPlayerStrike(strikeWeighed1, () => dieToFloat(3, 6));
    expect(enemyAttackWeighed1.combat?.enemyHit).toBe(true);

    // Weighed down state (+2 penalty: 4 pack items + 1 equipped weapon = 5 carried items, 2 over limit)
    const weighedState2 = {
      ...normalState,
      inventory: [
        { name: '1', type: 'potion' as const, desc: '' },
        { name: '2', type: 'potion' as const, desc: '' },
        { name: '3', type: 'potion' as const, desc: '' },
        { name: '4', type: 'potion' as const, desc: '' },
      ],
    };
    // Player strike with roll of 4: needs 3+2 = 5+, so 4 misses!
    const strikeWeighed2 = playerStrike(weighedState2, () => dieToFloat(4, 6));
    expect(strikeWeighed2.combat?.playerHit).toBe(false);

    // Enemy attack counter: with +2 penalty, enemy hits on 4-2 = 2+! So roll of 2 hits!
    const enemyAttackWeighed2 = continueAfterPlayerStrike(strikeWeighed2, () => dieToFloat(2, 6));
    expect(enemyAttackWeighed2.combat?.enemyHit).toBe(true);
  });

  it('equipped armor reduces incoming attack damage by 1 (minimum 1)', () => {
    // Zombie damage 2 vs toughness 1 -> base 2 dmg.
    const stateWithArmor = {
      ...enterDarkWood(createInitialState(), () => 0.9), // Zombie
      hp: 10,
      armor: { name: 'Mithril Chainmail', defense: 1, desc: 'Reduces dmg by 1' },
      combat: {
        ...enterDarkWood(createInitialState(), () => 0.9).combat!,
        phase: 'player_strike_result' as const,
      },
    };

    // Zombie hits with roll 6
    const afterHit = continueAfterPlayerStrike(stateWithArmor, () => dieToFloat(6, 6));
    expect(afterHit.combat?.enemyHit).toBe(true);
    // Base dmg = 2, reduced by 1 = 1 dmg
    expect(afterHit.combat?.enemyDamageDealt).toBe(1);
    expect(afterHit.hp).toBe(9);
  });
});
