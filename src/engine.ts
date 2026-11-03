import type {
  Weapon,
  EnemyType,
  Enemy,
  Item,
  GameState,
  Rng,
} from './types';

export const APP_VERSION = '0.4.0';

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
    instant: true,
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
    instant: true,
    desc: 'Potent tonic! Restores +6 HP.',
  },
];

export const LOCKED_CHEST_LOOT_TABLE: Item[] = [
  {
    name: 'Full Restoration Potion',
    type: 'potion',
    heal: 99,
    instant: true,
    desc: 'Restores all HP to full.',
  },
  {
    name: 'Dragonfang Blade',
    type: 'weapon',
    weapon: {
      name: 'Dragonfang Blade',
      skill: 3,
      damage: 6,
      desc: 'Forged from ancient wyrm-bone.',
    },
    desc: 'Forged from ancient wyrm-bone.',
  },
  {
    name: 'Mithril Chainmail',
    type: 'armor',
    armor: {
      name: 'Mithril Chainmail',
      defense: 1,
      desc: 'Absorbs 1 damage per hit.',
    },
    desc: 'Absorbs 1 damage per hit.',
  },
  {
    name: 'Vorpal Cleaver',
    type: 'weapon',
    weapon: {
      name: 'Vorpal Cleaver',
      skill: 2,
      damage: 4,
      desc: 'Deadly sharpness strikes on 2+.',
    },
    desc: 'Deadly sharpness strikes on 2+.',
  },
  {
    name: 'Phoenix Draught',
    type: 'potion',
    heal: 10,
    instant: true,
    desc: 'Fiery essence restores +10 HP.',
  },
  {
    name: 'Runed Aegis',
    type: 'armor',
    armor: {
      name: 'Runed Aegis',
      defense: 1,
      desc: 'Warded crest absorbs 1 damage per hit.',
    },
    desc: 'Absorbs 1 damage per hit.',
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

export const CARRY_CAPACITY = 3;

export function getCarriedItemCount(state: GameState): number {
  const weaponCount = state.weapon ? 1 : 0;
  const armorCount = state.armor ? 1 : 0;
  const packCount = state.inventory?.length ?? 0;
  return weaponCount + armorCount + packCount;
}

export function getWeighedDownPenalty(state: GameState | Item[]): number {
  const count = Array.isArray(state) ? state.length + 1 : getCarriedItemCount(state);
  return Math.max(0, count - CARRY_CAPACITY);
}

export function isWeighedDown(state: GameState | Item[]): boolean {
  return getWeighedDownPenalty(state) > 0;
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
    armor: item.armor ? { ...item.armor } : undefined,
  };
}

export function rollLockedChestItem(rng: Rng = Math.random): Item {
  const roll = rollD6(rng);
  const item = LOCKED_CHEST_LOOT_TABLE[roll - 1];
  return {
    ...item,
    weapon: item.weapon ? { ...item.weapon } : undefined,
    armor: item.armor ? { ...item.armor } : undefined,
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
  const count = rollD3(rng);
  return Array.from({ length: count }, () => rollLootItem(rng));
}

export function createInitialState(): GameState {
  return {
    screen: 'title',
    hp: 13,
    maxHp: 13,
    lamps: 0,
    weapon: { ...STARTING_WEAPON },
    inventory: [],
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

  const isLocked = rollD6(rng) === 6;
  if (isLocked) {
    const items = [rollLockedChestItem(rng)];
    return {
      ...state,
      screen: 'chest',
      combat: undefined,
      pauseMessage: undefined,
      stepsSincePause: steps,
      chest: {
        items,
        selectedIndex: 0,
        message: 'A heavy ironbound coffer with a sturdy lock rests among the roots. A roll of 5+ on a D6 is required to open it.',
        isLocked: true,
        opened: false,
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
      isLocked: false,
      opened: false,
    },
  };
}

export function openChest(state: GameState): GameState {
  const chest = state.chest;
  if (!chest) return state;
  if (chest.isLocked) return state;
  return {
    ...state,
    chest: {
      ...chest,
      opened: true,
      message: 'The coffer is opened.',
    },
  };
}

export function unlockChest(state: GameState, rng: Rng = Math.random): GameState {
  const chest = state.chest;
  if (!chest || !chest.isLocked) return state;

  const roll = rollD6(rng);
  if (roll >= 5) {
    return {
      ...state,
      chest: {
        ...chest,
        opened: true,
        unlockFailed: false,
        lastUnlockRoll: roll,
        message: `Rolled a ${roll} (needed 5+). The lock clicks open!`,
      },
    };
  }

  const newHp = Math.max(0, state.hp - 1);
  if (newHp <= 0) {
    return {
      ...state,
      hp: 0,
      screen: 'game_over',
      deathCause: 'Killed by a needle trap while picking a locked chest',
      chest: {
        ...chest,
        unlockFailed: true,
        lastUnlockRoll: roll,
        message: `Rolled a ${roll} (needed 5+). A poison needle trap triggers!`,
      },
    };
  }

  return {
    ...state,
    hp: newHp,
    chest: {
      ...chest,
      unlockFailed: true,
      lastUnlockRoll: roll,
      message: `Rolled a ${roll} (needed 5+). A needle trap inflicts 1 damage!`,
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
  const penalty = getWeighedDownPenalty(state);
  const neededSkill = Math.max(1, enemy.skill - penalty);
  const hit = roll >= neededSkill;
  let dmg = hit ? calculateDamage(enemy.damage, 1) : 0;
  if (hit && state.armor) {
    dmg = Math.max(1, dmg - state.armor.defense);
  }
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
        logMessage: `${prefixLog}${enemy.name} rolled ${roll} (needs ${neededSkill}+) and dealt ${dmg} damage!`,
      },
    };
  }

  const attackMsg = hit
    ? `${enemy.name} hits for ${dmg} damage! (Rolled ${roll} vs ${neededSkill}+)`
    : `${enemy.name} missed! (Rolled ${roll} vs ${neededSkill}+)`;

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
  const penalty = getWeighedDownPenalty(state);
  const neededSkill = state.weapon.skill + penalty;
  const hit = roll >= neededSkill;

  if (!hit) {
    return {
      ...state,
      combat: {
        ...combat,
        phase: 'player_strike_result',
        lastPlayerRoll: roll,
        playerHit: false,
        playerDamageDealt: 0,
        logMessage: `Your ${state.weapon.name} missed! (Rolled ${roll}, needed ${neededSkill}+)`,
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
      logMessage: `Hit ${enemy.name} for ${dmg} damage! (Rolled ${roll} vs ${neededSkill}+)`,
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
  index?: number
): GameState {
  const chest = state.chest;
  if (!chest || chest.items.length === 0) return state;

  const targetIndex = index !== undefined ? index : chest.selectedIndex;
  const item = chest.items[targetIndex];
  if (!item) return state;

  const remainingItems = chest.items.filter((_, idx) => idx !== targetIndex);
  const newInventory = [...(state.inventory ?? []), { ...item }];

  return {
    ...state,
    inventory: newInventory,
    chest: {
      ...chest,
      items: remainingItems,
      selectedIndex: 0,
      message: `Stowed ${item.name} in pack.`,
    },
  };
}

export function takeAllChestItems(state: GameState): GameState {
  const chest = state.chest;
  if (!chest || chest.items.length === 0) return state;

  const newInventory = [
    ...(state.inventory ?? []),
    ...chest.items.map((item) => ({ ...item })),
  ];

  return {
    ...state,
    inventory: newInventory,
    chest: {
      ...chest,
      items: [],
      selectedIndex: 0,
      message: 'All items stowed in pack.',
    },
  };
}

export function closeChest(state: GameState, rng: Rng = Math.random): GameState {
  return startNextEncounter(state, rng);
}

export const leaveChest = closeChest;

export function applyInventoryItem(state: GameState, index: number): GameState {
  const inv = state.inventory ?? [];
  if (index < 0 || index >= inv.length) return state;

  const item = inv[index];

  // 1. Weapon equip: swap with current weapon
  if (item.type === 'weapon' && item.weapon) {
    const currentWeapon = state.weapon;
    const newWeapon = { ...item.weapon };
    const newInv = [...inv];
    newInv[index] = {
      name: currentWeapon.name,
      type: 'weapon',
      weapon: { ...currentWeapon },
      desc: currentWeapon.desc,
    };
    return {
      ...state,
      weapon: newWeapon,
      inventory: newInv,
    };
  }

  // 2. Armor equip: swap if already equipped, or equip and remove from inventory
  if (item.type === 'armor' && item.armor) {
    const currentArmor = state.armor;
    const newArmor = { ...item.armor };
    const newInv = [...inv];
    if (currentArmor) {
      newInv[index] = {
        name: currentArmor.name,
        type: 'armor',
        armor: { ...currentArmor },
        desc: currentArmor.desc,
      };
    } else {
      newInv.splice(index, 1);
    }
    return {
      ...state,
      armor: newArmor,
      inventory: newInv,
    };
  }

  // 3. Instant potion consumable
  if (item.instant || item.type === 'potion' || item.type === 'double_potion') {
    const heal = item.heal ?? 3;
    const newHp = Math.min(state.maxHp, state.hp + heal);
    const newInv = inv.filter((_, idx) => idx !== index);
    return {
      ...state,
      hp: newHp,
      inventory: newInv,
    };
  }

  return state;
}

export function discardInventoryItem(state: GameState, index: number): GameState {
  const inv = state.inventory ?? [];
  if (index < 0 || index >= inv.length) return state;
  return {
    ...state,
    inventory: inv.filter((_, idx) => idx !== index),
  };
}

export function restartGame(): GameState {
  return createInitialState();
}
