import type {
  Weapon,
  EnemyType,
  Enemy,
  Item,
  GameState,
  Rng,
} from './types';

export const APP_VERSION = '0.2.1';

export const STARTING_WEAPON: Weapon = {
  name: 'Rusty Dagger',
  skill: 3,
  damage: 2,
  desc: 'A tarnished but sharp blade.',
};

export const BESTIARY: Record<EnemyType, Omit<Enemy, 'hp'>> = {
  rat: {
    name: 'Dire Rat',
    type: 'rat',
    maxHp: 2,
    toughness: 1,
    skill: 4,
    damage: 1,
    desc: 'A quick, rabid vermin.',
  },
  zombie: {
    name: 'Zombie',
    type: 'zombie',
    maxHp: 4,
    toughness: 1,
    skill: 4,
    damage: 2,
    desc: 'A decaying forest thrall.',
  },
  wolf: {
    name: 'Shadow Wolf',
    type: 'wolf',
    maxHp: 6,
    toughness: 1,
    skill: 3,
    damage: 3,
    desc: 'A savage nocturnal stalker.',
  },
  spider: {
    name: 'Giant Spider',
    type: 'spider',
    maxHp: 8,
    toughness: 2,
    skill: 3,
    damage: 4,
    desc: 'A lethal webbed monstrosity.',
  },
};

export const LOOT_TABLE: Item[] = [
  {
    name: 'Elixir of Life',
    type: 'potion',
    heal: 3,
    desc: 'Restores +3 HP.',
  },
  {
    name: 'Spiked Club',
    type: 'weapon',
    weapon: {
      name: 'Spiked Club',
      skill: 4,
      damage: 3,
      desc: 'Crude but heavy.',
    },
    desc: 'Crude but heavy.',
  },
  {
    name: 'Hunting Spear',
    type: 'weapon',
    weapon: {
      name: 'Hunting Spear',
      skill: 3,
      damage: 3,
      desc: 'Keeps foes at bay.',
    },
    desc: 'Keeps foes at bay.',
  },
  {
    name: 'Broadsword',
    type: 'weapon',
    weapon: {
      name: 'Broadsword',
      skill: 4,
      damage: 5,
      desc: 'Devastating heavy steel.',
    },
    desc: 'Devastating heavy steel.',
  },
  {
    name: 'Silver Rapier',
    type: 'weapon',
    weapon: {
      name: 'Silver Rapier',
      skill: 3,
      damage: 4,
      desc: 'Fierce finesse blade.',
    },
    desc: 'Fierce finesse blade.',
  },
  {
    name: 'Double Draught',
    type: 'double_potion',
    heal: 6,
    desc: 'Potent tonic! Restores +6 HP.',
  },
];

export function rollD6(rng: Rng = Math.random): number {
  return Math.min(6, Math.floor(rng() * 6) + 1);
}

export function rollD3(rng: Rng = Math.random): number {
  return Math.min(3, Math.floor(rng() * 3) + 1);
}

export function calculateDamage(weaponDamage: number, targetToughness: number): number {
  return Math.max(1, weaponDamage - Math.floor(targetToughness / 2));
}

export function createEnemy(type: EnemyType): Enemy {
  const template = BESTIARY[type];
  return {
    ...template,
    hp: template.maxHp,
  };
}

export function rollEnemy(rng: Rng = Math.random): Enemy {
  const roll = rollD6(rng);
  if (roll === 1) return createEnemy('rat');
  if (roll <= 3) return createEnemy('zombie');
  if (roll <= 5) return createEnemy('wolf');
  return createEnemy('spider');
}

export function rollLootItem(rng: Rng = Math.random): Item {
  const roll = rollD6(rng);
  const item = LOOT_TABLE[roll - 1];
  return {
    ...item,
    weapon: item.weapon ? { ...item.weapon } : undefined,
  };
}

export const PAUSE_MESSAGES: string[] = [
  'A cold breeze whispers through the hollow branches.',
  'You pause to catch your breath beneath a towering black pine.',
  'Distantly, a lone raven calls into the gathering mist.',
  'The canopy thickens above, blotting out the pale sky.',
  'Soft rustling in the dead leaves puts you on guard, but nothing emerges.',
  'A heavy, watchful silence settles over the damp forest path.',
  'Faint green luminescence pulses from a cluster of rotting fungi.',
  'The trail narrows between two ancient, moss-choked boulders.',
  'You tighten your grip on your weapon and press forward into the shadows.',
  'A sudden snap of a dry twig rings out in the stillness.',
  'An ancient stone boundary marker lies half-buried in decaying brambles.',
  'A spectral fog drifts lazily across the twisted roots.',
  'The faint scent of old woodsmoke and damp earth lingers on the air.',
  'You wipe cold sweat from your brow; the gloom seems almost alive.',
  'A solitary pale moth flutters through the dark before vanishing.',
  'Black thorns claw at your cloak as you follow the winding trail.',
  'The air turns bitter and sharp; winter seems trapped in this grove.',
  'A trickle of icy water cuts across the sunken stone path.',
];

export const PAUSE_INTERVAL = 4;

export function rollPauseMessage(rng: Rng = Math.random): string {
  const index = Math.min(
    PAUSE_MESSAGES.length - 1,
    Math.floor(rng() * PAUSE_MESSAGES.length)
  );
  return PAUSE_MESSAGES[index];
}

export function rollChestItems(rng: Rng = Math.random): Item[] {
  return [rollLootItem(rng)];
}

export function createInitialState(): GameState {
  return {
    screen: 'title',
    hp: 13,
    maxHp: 13,
    lamps: 0,
    weapon: { ...STARTING_WEAPON },
    stepsSincePause: 0,
  };
}

export function enterDarkWood(state: GameState, rng: Rng = Math.random): GameState {
  const firstType: EnemyType = rng() < 0.5 ? 'rat' : 'zombie';
  const enemy = createEnemy(firstType);
  return {
    ...state,
    screen: 'enemy',
    combat: {
      enemy,
      phase: 'encounter',
      logMessage: `A ${enemy.name} emerges from the gloom!`,
    },
  };
}

export function startNextEncounter(state: GameState, rng: Rng = Math.random): GameState {
  const steps = (state.stepsSincePause ?? 0) + 1;
  if (steps >= PAUSE_INTERVAL) {
    return {
      ...state,
      screen: 'pause',
      combat: undefined,
      chest: undefined,
      stepsSincePause: 0,
      pauseMessage: rollPauseMessage(rng),
    };
  }

  const roll = rollD6(rng);
  if (roll <= 2) {
    return {
      ...state,
      screen: 'lamp',
      combat: undefined,
      chest: undefined,
      pauseMessage: undefined,
      stepsSincePause: steps,
    };
  }
  if (roll <= 5) {
    const enemy = rollEnemy(rng);
    return {
      ...state,
      screen: 'enemy',
      chest: undefined,
      pauseMessage: undefined,
      stepsSincePause: steps,
      combat: {
        enemy,
        phase: 'encounter',
        logMessage: 'A monster blocks the trail!',
      },
    };
  }
  const items = rollChestItems(rng);
  return {
    ...state,
    screen: 'chest',
    combat: undefined,
    pauseMessage: undefined,
    stepsSincePause: steps,
    chest: {
      items,
      selectedIndex: 0,
      message: 'An ancient ironbound coffer rests among the twisted roots.',
    },
  };
}

export function lightLamp(state: GameState, rng: Rng = Math.random): GameState {
  const newLamps = state.lamps + 1;
  if (newLamps >= 10) {
    return {
      ...state,
      lamps: 10,
      screen: 'victory',
    };
  }
  const heal = rollD3(rng);
  const newHp = Math.min(state.maxHp, state.hp + heal);
  return {
    ...state,
    lamps: newLamps,
    hp: newHp,
    restHeal: heal,
    screen: 'rest',
  };
}

export function proceedFromRest(state: GameState, rng: Rng = Math.random): GameState {
  return startNextEncounter(state, rng);
}

export function proceedFromPause(state: GameState, rng: Rng = Math.random): GameState {
  return startNextEncounter(state, rng);
}

function resolveEnemyAttack(
  state: GameState,
  rng: Rng,
  prefixLog = ''
): GameState {
  const combat = state.combat;
  if (!combat) return state;

  const { enemy } = combat;
  const roll = rollD6(rng);
  const hit = roll >= enemy.skill;
  const dmg = hit ? calculateDamage(enemy.damage, 1) : 0;
  const newHp = Math.max(0, state.hp - dmg);

  if (newHp <= 0) {
    return {
      ...state,
      hp: 0,
      screen: 'game_over',
      deathCause: `Slain by ${enemy.name}`,
      combat: {
        ...combat,
        lastEnemyRoll: roll,
        enemyHit: hit,
        enemyDamageDealt: dmg,
        logMessage: `${prefixLog}${enemy.name} rolled ${roll} (needs ${enemy.skill}+) and dealt ${dmg} damage!`,
      },
    };
  }

  const attackMsg = hit
    ? `${enemy.name} hits for ${dmg} damage! (Rolled ${roll} vs ${enemy.skill}+)`
    : `${enemy.name} missed! (Rolled ${roll} vs ${enemy.skill}+)`;

  return {
    ...state,
    hp: newHp,
    combat: {
      ...combat,
      phase: 'enemy_turn_result',
      lastEnemyRoll: roll,
      enemyHit: hit,
      enemyDamageDealt: dmg,
      logMessage: prefixLog ? `${prefixLog} ${attackMsg}` : attackMsg,
    },
  };
}

export function fightEncounter(state: GameState, rng: Rng = Math.random): GameState {
  const combat = state.combat;
  if (!combat) return state;

  let playerRoll = rollD6(rng);
  let enemyRoll = rollD6(rng);
  let guard = 0;
  while (playerRoll === enemyRoll && guard < 20) {
    playerRoll = rollD6(rng);
    enemyRoll = rollD6(rng);
    guard++;
  }
  if (playerRoll === enemyRoll) {
    playerRoll = 6;
    enemyRoll = 1;
  }

  const playerWins = playerRoll > enemyRoll;

  if (playerWins) {
    return {
      ...state,
      combat: {
        ...combat,
        phase: 'player_turn',
        playerPriorityRoll: playerRoll,
        enemyPriorityRoll: enemyRoll,
        playerWinsPriority: true,
        logMessage: `Initiative won! (You: ${playerRoll} vs Enemy: ${enemyRoll})`,
      },
    };
  }

  const stateWithPriority: GameState = {
    ...state,
    combat: {
      ...combat,
      playerPriorityRoll: playerRoll,
      enemyPriorityRoll: enemyRoll,
      playerWinsPriority: false,
    },
  };

  return resolveEnemyAttack(
    stateWithPriority,
    rng,
    `Enemy won initiative (${enemyRoll} vs ${playerRoll})!`
  );
}

export function fleeCombat(state: GameState, rng: Rng = Math.random): GameState {
  const combat = state.combat;
  if (!combat) return state;

  if (state.lamps > 0) {
    return {
      ...state,
      lamps: state.lamps - 1,
      combat: {
        ...combat,
        phase: 'fled',
        fleeDamage: undefined,
        logMessage:
          'You fled into the shadows. A sacred lamp goes out in the gloom!',
      },
    };
  }

  const dmg = rollD3(rng);
  const newHp = Math.max(0, state.hp - dmg);

  if (newHp <= 0) {
    return {
      ...state,
      hp: 0,
      screen: 'game_over',
      deathCause: `Felled while escaping ${combat.enemy.name}`,
      combat: {
        ...combat,
        fleeDamage: dmg,
      },
    };
  }

  return {
    ...state,
    hp: newHp,
    combat: {
      ...combat,
      phase: 'fled',
      fleeDamage: dmg,
      logMessage: `You broke away, taking ${dmg} damage.`,
    },
  };
}

export function playerStrike(state: GameState, rng: Rng = Math.random): GameState {
  const combat = state.combat;
  if (!combat) return state;

  const { enemy } = combat;
  const roll = rollD6(rng);
  const hit = roll >= state.weapon.skill;

  if (!hit) {
    return {
      ...state,
      combat: {
        ...combat,
        phase: 'player_strike_result',
        lastPlayerRoll: roll,
        playerHit: false,
        playerDamageDealt: 0,
        logMessage: `Your ${state.weapon.name} missed! (Rolled ${roll}, needed ${state.weapon.skill}+)`,
      },
    };
  }

  const dmg = calculateDamage(state.weapon.damage, enemy.toughness);
  const newEnemyHp = Math.max(0, enemy.hp - dmg);
  const updatedEnemy: Enemy = {
    ...enemy,
    hp: newEnemyHp,
  };

  if (newEnemyHp <= 0) {
    const heal = rollD3(rng);
    const newPlayerHp = Math.min(state.maxHp, state.hp + heal);
    return {
      ...state,
      hp: newPlayerHp,
      combat: {
        ...combat,
        enemy: updatedEnemy,
        phase: 'enemy_defeated',
        lastPlayerRoll: roll,
        playerHit: true,
        playerDamageDealt: dmg,
        healAmount: heal,
        logMessage: `Dealt ${dmg} damage and slew the ${enemy.name}!`,
      },
    };
  }

  return {
    ...state,
    combat: {
      ...combat,
      enemy: updatedEnemy,
      phase: 'player_strike_result',
      lastPlayerRoll: roll,
      playerHit: true,
      playerDamageDealt: dmg,
      logMessage: `Hit ${enemy.name} for ${dmg} damage! (Rolled ${roll} vs ${state.weapon.skill}+)`,
    },
  };
}

export function continueAfterPlayerStrike(
  state: GameState,
  rng: Rng = Math.random
): GameState {
  return resolveEnemyAttack(state, rng);
}

export function continueAfterEnemyTurn(state: GameState): GameState {
  const combat = state.combat;
  if (!combat) return state;

  return {
    ...state,
    combat: {
      ...combat,
      phase: 'player_turn',
      logMessage: 'Your turn to strike!',
    },
  };
}

export function proceedFromCombat(state: GameState, rng: Rng = Math.random): GameState {
  return startNextEncounter(state, rng);
}

export function takeChestItem(
  state: GameState,
  index?: number,
  rng: Rng = Math.random
): GameState {
  const chest = state.chest;
  if (!chest || chest.items.length === 0) return state;

  const targetIndex = index !== undefined ? index : chest.selectedIndex;
  const item = chest.items[targetIndex];
  if (!item) return state;

  let newHp = state.hp;
  let newWeapon = state.weapon;
  let statusMsg = '';

  if (item.type === 'potion' || item.type === 'double_potion') {
    const heal = item.heal ?? 3;
    newHp = Math.min(state.maxHp, state.hp + heal);
    statusMsg = `Drank ${item.name}! (+${heal} HP)`;
  } else if (item.type === 'weapon' && item.weapon) {
    newWeapon = { ...item.weapon };
    statusMsg = `Equipped ${item.weapon.name}!`;
  }

  const remainingItems = chest.items.filter((_, idx) => idx !== targetIndex);

  const updatedState: GameState = {
    ...state,
    hp: newHp,
    weapon: newWeapon,
    chest: {
      items: remainingItems,
      selectedIndex: 0,
      message: statusMsg,
    },
  };

  if (remainingItems.length === 0) {
    return startNextEncounter(updatedState, rng);
  }

  return updatedState;
}

export function leaveChest(state: GameState, rng: Rng = Math.random): GameState {
  return startNextEncounter(state, rng);
}

export function restartGame(): GameState {
  return createInitialState();
}
