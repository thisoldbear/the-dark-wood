import { useState, useEffect } from 'react';
import {
  APP_VERSION,
  createInitialState,
  enterDarkWood,
  lightLamp,
  proceedFromRest,
  proceedFromPause,
  fightEncounter,
  fleeCombat,
  playerStrike,
  continueAfterPlayerStrike,
  continueAfterEnemyTurn,
  proceedFromCombat,
  openChest,
  unlockChest,
  takeChestItem,
  takeAllChestItems,
  leaveChest,
  applyInventoryItem,
  discardInventoryItem,
  getCarriedItemCount,
  getWeighedDownPenalty,
  restartGame,
} from './engine';
import type { GameState, Rng } from './types';
import { PixelIcon } from './components/PixelIcon';
import { DiceBox } from './components/DiceBox';
import './App.css';

interface AppProps {
  initialState?: GameState;
  rng?: Rng;
}

const TITLES: Record<string, string> = {
  enemy: 'COMBAT',
  lamp: 'SACRED LAMP',
  rest: 'SANCTUARY',
  pause: 'THE TRAIL',
  chest: 'CHEST',
  victory: 'VICTORY',
  game_over: 'GAME OVER',
};

export function App({ initialState, rng = Math.random }: AppProps) {
  const [state, setState] = useState<GameState>(
    () => initialState ?? createInitialState()
  );
  const [showChangelog, setShowChangelog] = useState(false);
  const [discardConfirmIndex, setDiscardConfirmIndex] = useState<number | null>(null);

  const act = (fn: (prev: GameState) => GameState) => setState(fn);

  const handleEnter = () => act((prev) => enterDarkWood(prev, rng));
  const handleLightLamp = () => act((prev) => lightLamp(prev, rng));
  const handleProceedFromRest = () => act((prev) => proceedFromRest(prev, rng));
  const handleProceedFromPause = () => act((prev) => proceedFromPause(prev, rng));
  const handleFight = () => act((prev) => fightEncounter(prev, rng));
  const handleFlee = () => act((prev) => fleeCombat(prev, rng));
  const handleStrike = () => act((prev) => playerStrike(prev, rng));
  const handleContinueStrike = () => act((prev) => continueAfterPlayerStrike(prev, rng));
  const handleContinueEnemy = () => act(continueAfterEnemyTurn);
  const handleProceedCombat = () => act((prev) => proceedFromCombat(prev, rng));
  const handleOpenChest = () => act(openChest);
  const handleUnlockChest = () => act((prev) => unlockChest(prev, rng));
  const handleTakeChest = (index?: number) => act((prev) => takeChestItem(prev, index));
  const handleTakeAllChest = () => act(takeAllChestItems);
  const handleLeaveChest = () => act((prev) => leaveChest(prev, rng));
  const handleUseInventory = (index: number) => act((prev) => applyInventoryItem(prev, index));
  const handleDiscardInventory = (index: number) => setDiscardConfirmIndex(index);
  const confirmDiscard = () => {
    if (discardConfirmIndex !== null) {
      act((prev) => discardInventoryItem(prev, discardConfirmIndex));
      setDiscardConfirmIndex(null);
    }
  };
  const cancelDiscard = () => setDiscardConfirmIndex(null);
  const handleRestart = () => act(restartGame);

  const totalItems = getCarriedItemCount(state);
  const penalty = getWeighedDownPenalty(state);
  const weighed = penalty > 0;

  // Optional keyboard shortcuts (Enter/Space for primary action, Escape/F for secondary)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLButtonElement &&
        (e.key === 'Enter' || e.key === ' ')
      ) {
        return;
      }
      if (e.key === 'Escape') {
        if (discardConfirmIndex !== null) {
          setDiscardConfirmIndex(null);
          return;
        }
        if (showChangelog) {
          setShowChangelog(false);
          return;
        }
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state.screen === 'title') handleEnter();
        else if (state.screen === 'lamp') handleLightLamp();
        else if (state.screen === 'rest') handleProceedFromRest();
        else if (state.screen === 'pause') handleProceedFromPause();
        else if (state.screen === 'victory' || state.screen === 'game_over')
          handleRestart();
        else if (state.screen === 'chest') {
          if (!state.chest?.opened) {
            if (state.chest?.isLocked) handleUnlockChest();
            else handleOpenChest();
          } else {
            if (state.chest.items.length === 0) handleLeaveChest();
            else handleTakeAllChest();
          }
        }
        else if (state.screen === 'enemy' && state.combat) {
          const p = state.combat.phase;
          if (p === 'encounter') handleFight();
          else if (p === 'player_turn') handleStrike();
          else if (p === 'player_strike_result') handleContinueStrike();
          else if (p === 'enemy_turn_result') handleContinueEnemy();
          else if (p === 'enemy_defeated' || p === 'fled')
            handleProceedCombat();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (
          state.screen === 'enemy' &&
          (state.combat?.phase === 'encounter' ||
            state.combat?.phase === 'player_turn')
        ) {
          handleFlee();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, showChangelog, discardConfirmIndex, rng]);

  return (
    <div className="dark-wood-viewport">
      <main className="game-card" data-testid="game-card">
        {state.screen !== 'title' && (
          <header className="status-header" data-testid="status-header">
            <div className="status-header__left">
              <span className="status-header__title">
                {TITLES[state.screen] ?? 'THE DARK WOOD'}
              </span>
            </div>
            <div className="status-header__right">
              <span className="status-stat">
                HP: {state.hp}/{state.maxHp}
              </span>
              <span className="status-divider">|</span>
              <span className="status-stat">L: {state.lamps}/10</span>
              <span className="status-divider">|</span>
              <span className="status-weapon" title={state.weapon.desc}>
                {state.weapon.name} ({state.weapon.skill}+ / {state.weapon.damage}{' '}
                DMG)
              </span>
              {state.armor && (
                <>
                  <span className="status-divider">|</span>
                  <span className="status-armor" title={state.armor.desc}>
                    Armor: {state.armor.name} (-{state.armor.defense} DMG)
                  </span>
                </>
              )}
            </div>
          </header>
        )}

        {/* 1. TITLE SCREEN */}
        {state.screen === 'title' && (
          <div className="screen-body screen-body--centered">
            <div className="icon-showcase">
              <PixelIcon name="swords" size={72} />
            </div>
            <h1 className="game-title">THE DARK WOOD</h1>
            <p className="game-subtitle">A Fantasy Dice RPG</p>
            <div className="pixel-panel rules-box">
              <p className="rules-text">
                Find &amp; light 10 sacred lamps to banish the deep darkness.
              </p>
              <p className="rules-stats">HP: 13 | Weapon: Rusty Dagger</p>
            </div>
            <div className="action-bar">
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={handleEnter}
              >
                ENTER
              </button>
            </div>
          </div>
        )}

        {/* 2. SACRED LAMP SCREEN */}
        {state.screen === 'lamp' && (
          <div className="screen-body">
            <section className="enemy-card">
              <div className="enemy-card__icon">
                <PixelIcon name="lamp" size={56} />
              </div>
              <div className="enemy-card__info">
                <div className="enemy-card__name-row">
                  <h2 className="enemy-card__name">YOU FIND AN UNLIT LAMP</h2>
                </div>
                <div className="enemy-card__stats">
                  <span className="enemy-stat-badge">UNLIT</span>
                  <span className="enemy-stat-badge">HOLY FLAME</span>
                </div>
              </div>
            </section>

            <section className="combat-box">
              <div className="combat-box__content">
                <p className="flavor-text">
                  Light this lamp to dispel the suffocating black gloom.
                </p>
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary"
                  onClick={handleLightLamp}
                >
                  LIGHT THE LAMP
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 3. REST / SANCTUARY SCREEN */}
        {state.screen === 'rest' && (
          <div className="screen-body">
            <section className="enemy-card">
              <div className="enemy-card__icon">
                <PixelIcon name="lamp" size={56} />
              </div>
              <div className="enemy-card__info">
                <div className="enemy-card__name-row">
                  <h2 className="enemy-card__name">YOU REST BY THE LIGHT</h2>
                </div>
                <div className="enemy-card__stats">
                  <span className="enemy-stat-badge">REST SITE</span>
                  <span className="enemy-stat-badge">HEALS WOUNDS</span>
                </div>
              </div>
            </section>

            <section className="combat-box">
              <div className="combat-box__content">
                <p className="heal-log">
                  Recovered +{state.restHeal ?? 0} HP! (HP: {state.hp}/{state.maxHp})
                </p>
                <p className="flavor-text">
                  The holy flame keeps beasts at bay. Warmth returns to your limbs.
                </p>
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary"
                  onClick={handleProceedFromRest}
                >
                  PROCEED
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 3b. PAUSE / RESPITE SCREEN */}
        {state.screen === 'pause' && (
          <div className="screen-body">
            <section className="enemy-card">
              <div className="enemy-card__icon">
                <PixelIcon name="tree" size={56} />
              </div>
              <div className="enemy-card__info">
                <div className="enemy-card__name-row">
                  <h2 className="enemy-card__name">A MOMENT OF RESPITE</h2>
                </div>
                <div className="enemy-card__stats">
                  <span className="enemy-stat-badge">SAFE HAVEN</span>
                  <span className="enemy-stat-badge">TRAIL REST</span>
                </div>
              </div>
            </section>

            <section className="combat-box">
              <div className="combat-box__content">
                <p className="flavor-text">
                  {state.pauseMessage ??
                    'The deep woods stretch endlessly in all directions.'}
                </p>
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary"
                  onClick={handleProceedFromPause}
                >
                  PROCEED
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 4. ENEMY / COMBAT SCREEN */}
        {state.screen === 'enemy' && state.combat && (
          <div className="screen-body">
            {/* Persistent Top Enemy Card */}
            <section className="enemy-card" data-testid="enemy-card">
              <div className="enemy-card__icon">
                <PixelIcon name={state.combat.enemy.type} size={56} />
              </div>
              <div className="enemy-card__info">
                <div className="enemy-card__name-row">
                  <h2 className="enemy-card__name">
                    {state.combat.enemy.name}
                  </h2>
                  <span className="enemy-card__skill">
                    Hits on: {state.combat.enemy.skill}+ | Damage:{' '}
                    {state.combat.enemy.damage}
                  </span>
                </div>
                <div className="enemy-card__stats">
                  <span className="enemy-stat-badge">
                    HP: {state.combat.enemy.hp}/{state.combat.enemy.maxHp}
                  </span>
                  <span className="enemy-stat-badge">
                    Toughness: {state.combat.enemy.toughness}
                  </span>
                </div>
              </div>
            </section>

            {/* Interactive Middle Combat Box */}
            <section className="combat-box" data-testid="combat-box">
              {state.combat.phase === 'encounter' && (
                <>
                  <h3 className="combat-phase-title">
                    A monster blocks the trail!
                  </h3>
                  <p className="flavor-text">"{state.combat.enemy.desc}"</p>
                  <div className="weapon-summary-box">
                    <PixelIcon name="sword" size={28} />
                    <div>
                      <div className="weapon-summary-name">
                        Current weapon: {state.weapon.name}
                      </div>
                      <div className="weapon-summary-stats">
                        Hits on {state.weapon.skill + penalty}+ | Damage:{' '}
                        {state.weapon.damage}
                      </div>
                    </div>
                  </div>
                  {weighed && (
                    <div
                      className="combat-weighed-down-note"
                      data-testid="combat-weighed-down-note"
                    >
                      WEIGHED DOWN (+{penalty}): Enemy hits on{' '}
                      {Math.max(1, state.combat.enemy.skill - penalty)}+ | Your strike
                      needs {state.weapon.skill + penalty}+. Discard some items below.
                    </div>
                  )}
                  <div className="action-bar">
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--primary"
                      onClick={handleFight}
                    >
                      FIGHT
                    </button>
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--secondary"
                      onClick={handleFlee}
                    >
                      FLEE
                    </button>
                  </div>
                </>
              )}

              {state.combat.phase === 'player_turn' && (
                <>
                  <h3 className="combat-phase-title">YOUR TURN TO STRIKE!</h3>
                  <p className="combat-log">{state.combat.logMessage}</p>
                  <div className="weapon-summary-box">
                    <PixelIcon name="sword" size={28} />
                    <div>
                      <div className="weapon-summary-name">
                        Current weapon: {state.weapon.name}
                      </div>
                      <div className="weapon-summary-stats">
                        Hits on {state.weapon.skill + penalty}+ | Damage:{' '}
                        {state.weapon.damage}
                      </div>
                    </div>
                  </div>
                  {weighed && (
                    <div
                      className="combat-weighed-down-note"
                      data-testid="combat-weighed-down-note"
                    >
                      WEIGHED DOWN (+{penalty}): Enemy hits on{' '}
                      {Math.max(1, state.combat.enemy.skill - penalty)}+ | Your strike
                      needs {state.weapon.skill + penalty}+. Discard some items below.
                    </div>
                  )}
                  <p className="combat-note">
                    {state.lamps > 0
                      ? 'Fleeing extinguishes 1 lamp.'
                      : 'Fleeing inflicts 1-3 damage.'}
                  </p>
                  <div className="action-bar">
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--primary"
                      onClick={handleStrike}
                    >
                      STRIKE
                    </button>
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--secondary"
                      onClick={handleFlee}
                    >
                      FLEE
                    </button>
                  </div>
                </>
              )}

              {state.combat.phase === 'player_strike_result' && (
                <>
                  <h3 className="combat-phase-title">PLAYER ATTACK</h3>
                  <DiceBox
                    roll={state.combat.lastPlayerRoll ?? 1}
                    hit={Boolean(state.combat.playerHit)}
                  />
                  <p className="combat-log">{state.combat.logMessage}</p>
                  <p className="combat-substat">
                    Enemy HP remaining: {state.combat.enemy.hp}/
                    {state.combat.enemy.maxHp}
                  </p>
                  <div className="action-bar">
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--primary"
                      onClick={handleContinueStrike}
                    >
                      CONTINUE
                    </button>
                  </div>
                </>
              )}

              {state.combat.phase === 'enemy_turn_result' && (
                <>
                  <h3 className="combat-phase-title">
                    {state.combat.enemy.name.toUpperCase()} ATTACKS
                  </h3>
                  <DiceBox
                    roll={state.combat.lastEnemyRoll ?? 1}
                    hit={Boolean(state.combat.enemyHit)}
                  />
                  <p className="combat-log">{state.combat.logMessage}</p>
                  <p className="combat-substat">
                    Your HP: {state.hp}/{state.maxHp}
                  </p>
                  <div className="action-bar">
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--primary"
                      onClick={handleContinueEnemy}
                    >
                      CONTINUE
                    </button>
                  </div>
                </>
              )}

              {state.combat.phase === 'enemy_defeated' && (
                <>
                  <div className="icon-showcase">
                    <PixelIcon name="skull" size={48} />
                  </div>
                  <h3 className="combat-phase-title">VICTORY!</h3>
                  <p className="combat-log">
                    The {state.combat.enemy.name} was slain.
                  </p>
                  <p className="heal-log">
                    Recovered +{state.combat.healAmount ?? 0} HP! (HP:{' '}
                    {state.hp}/{state.maxHp})
                  </p>
                  <div className="action-bar">
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--primary"
                      onClick={handleProceedCombat}
                    >
                      PROCEED
                    </button>
                  </div>
                </>
              )}

              {state.combat.phase === 'fled' && (
                <>
                  <h3 className="combat-phase-title">FLED COMBAT</h3>
                  <p className="combat-log">{state.combat.logMessage}</p>
                  <p className="combat-substat">
                    {state.combat.fleeDamage !== undefined
                      ? `Current HP: ${state.hp}/${state.maxHp}`
                      : `Lanterns Lit: ${state.lamps} / 10`}
                  </p>
                  <div className="action-bar">
                    <button
                      type="button"
                      className="pixel-btn pixel-btn--primary"
                      onClick={handleProceedCombat}
                    >
                      PROCEED
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* 5. CHEST SCREEN (UNOPENED / LOCKED) */}
        {state.screen === 'chest' && state.chest && !state.chest.opened && (
          <div className="screen-body">
            <section className="enemy-card">
              <div className="enemy-card__icon">
                <PixelIcon name="chest" size={56} />
              </div>
              <div className="enemy-card__info">
                <div className="enemy-card__name-row">
                  <h2 className="enemy-card__name">
                    {state.chest.isLocked ? 'LOCKED CHEST' : 'WOODLAND CHEST'}
                  </h2>
                </div>
                <div className="enemy-card__stats">
                  <span className="enemy-stat-badge">
                    {state.chest.isLocked ? 'LOCKED (5+ TO OPEN)' : 'TREASURE'}
                  </span>
                </div>
              </div>
            </section>

            <section className="combat-box">
              <div className="combat-box__content">
                <p className="flavor-text">{state.chest.message}</p>
                {state.chest.isLocked && state.chest.lastUnlockRoll !== undefined && (
                  <DiceBox
                    roll={state.chest.lastUnlockRoll}
                    hit={!state.chest.unlockFailed}
                  />
                )}
              </div>
              <div className="action-bar">
                {state.chest.isLocked ? (
                  <button
                    type="button"
                    className="pixel-btn pixel-btn--primary"
                    onClick={handleUnlockChest}
                  >
                    {state.chest.unlockFailed ? 'TRY AGAIN' : 'OPEN CHEST'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pixel-btn pixel-btn--primary"
                    onClick={handleOpenChest}
                  >
                    OPEN CHEST
                  </button>
                )}
                <button
                  type="button"
                  className="pixel-btn pixel-btn--secondary"
                  onClick={handleLeaveChest}
                >
                  LEAVE CHEST
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 5b. CHEST SCREEN (OPENED) */}
        {state.screen === 'chest' && state.chest && state.chest.opened && (
          <div className="screen-body">
            <section className="enemy-card">
              <div className="enemy-card__icon">
                <PixelIcon name="chest" size={56} />
              </div>
              <div className="enemy-card__info">
                <div className="enemy-card__name-row">
                  <h2 className="enemy-card__name">
                    {state.chest.isLocked ? 'LOCKED CHEST (OPEN)' : 'WOODLAND CHEST'}
                  </h2>
                </div>
                <div className="enemy-card__stats">
                  <span className="enemy-stat-badge">TREASURE</span>
                </div>
              </div>
            </section>

            <section className="combat-box">
              {state.chest.items.length === 0 ? (
                <div className="combat-box__content">
                  <p className="flavor-text">The chest is empty.</p>
                </div>
              ) : (
                <div className="chest-items-list">
                  {state.chest.items.map((item, idx) => {
                    const isSelected = idx === state.chest?.selectedIndex;
                    return (
                      <div key={`${item.name}-${idx}`} className="chest-loot-wrapper">
                        <div
                          data-testid={`chest-item-${idx}`}
                          className={`chest-item-card ${
                            isSelected ? 'chest-item-card--selected' : ''
                          }`}
                        >
                          <div className="chest-item-card__main">
                            <div className="chest-item-card__icon">
                              <PixelIcon
                                name={item.type === 'weapon' ? 'sword' : item.type === 'armor' ? 'shield' : 'potion'}
                                size={36}
                              />
                            </div>
                            <div className="chest-item-card__body">
                              <div className="chest-item-card__name">{item.name}</div>
                              <div className="chest-item-card__stats">
                                {item.type === 'weapon' && item.weapon
                                  ? `Weapon | Skill ${item.weapon.skill}+ | Damage ${item.weapon.damage}`
                                  : item.type === 'armor' && item.armor
                                  ? `Armor | Defense -${item.armor.defense} DMG`
                                  : `Potion | Heal +${item.heal} HP`}
                              </div>
                              <div className="chest-item-card__desc">"{item.desc}"</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="pixel-btn pixel-btn--primary chest-item-card__cta"
                            onClick={() => handleTakeChest(idx)}
                            data-testid={`chest-take-btn-${idx}`}
                          >
                            TAKE
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="action-bar">
                {state.chest.items.length > 0 && (
                  <button
                    type="button"
                    className="pixel-btn pixel-btn--primary"
                    onClick={handleTakeAllChest}
                  >
                    TAKE ALL
                  </button>
                )}
                <button
                  type="button"
                  className="pixel-btn pixel-btn--secondary"
                  onClick={handleLeaveChest}
                >
                  CLOSE CHEST
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 6. VICTORY SCREEN */}
        {state.screen === 'victory' && (
          <div className="screen-body screen-body--centered">
            <div className="icon-showcase">
              <PixelIcon name="lamp" size={64} />
            </div>
            <h2 className="screen-heading">DARK WOOD CONQUERED</h2>
            <p className="flavor-text">
              All 10 lanterns shine in harmony! The ancient curse is shattered.
            </p>
            <div className="pixel-banner">
              Final HP: {state.hp}/{state.maxHp}
            </div>
            <div className="action-bar">
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={handleRestart}
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}

        {/* 7. GAME OVER SCREEN */}
        {state.screen === 'game_over' && (
          <div className="screen-body">
            <section className="enemy-card">
              <div className="enemy-card__icon">
                <PixelIcon name="skull" size={56} />
              </div>
              <div className="enemy-card__info">
                <div className="enemy-card__name-row">
                  <h2 className="enemy-card__name">YOU HAVE FALLEN</h2>
                </div>
                <div className="enemy-card__stats">
                  <span className="enemy-stat-badge">DEFEATED</span>
                  <span className="enemy-stat-badge">JOURNEY'S END</span>
                </div>
              </div>
            </section>

            <section className="combat-box">
              <div className="combat-box__content">
                <p className="death-cause">
                  {state.deathCause ?? 'Claimed by the Dark Wood'}
                </p>
                <div className="pixel-banner">
                  Lanterns Lit: {state.lamps} / 10
                </div>
                <p className="flavor-text">
                  Your light fades into the choking gloom. The forest claims another soul.
                </p>
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary"
                  onClick={handleRestart}
                >
                  RESTART
                </button>
              </div>
            </section>
          </div>
        )}

        {/* INVENTORY SECTION */}
        {state.screen !== 'title' && (
          <section className="inventory-section" data-testid="inventory-section">
            <div className="inventory-section__header">
              <h3 className="inventory-section__title">
                INVENTORY ({totalItems} ITEMS)
              </h3>
            </div>

            {weighed && (
              <div className="weighed-down-banner" data-testid="weighed-down-box">
                <span className="weighed-down-tag">WEIGHED DOWN</span>
                <span className="weighed-down-text">
                  Carrying {totalItems} items (limit: 3). Foes hit +{penalty} easier and your hits require +{penalty} more! Discard some items below.
                </span>
              </div>
            )}

            <div className="inventory-grid" data-testid="inventory-grid">
              <div
                className="inventory-item-card inventory-item-card--equipped"
                data-testid="inventory-equipped-weapon"
              >
                <div className="inventory-item-tap-area" style={{ cursor: 'default' }}>
                  <div className="inventory-item-icon">
                    <PixelIcon name="sword" size={24} />
                  </div>
                  <div className="inventory-item-info">
                    <div className="inventory-item-name-row">
                      <span className="inventory-item-name">{state.weapon.name}</span>
                      <span className="item-badge item-badge--equipped">EQUIPPED WEAPON</span>
                    </div>
                    <div className="inventory-item-stats">
                      Skill {state.weapon.skill}+ | {state.weapon.damage} DMG
                    </div>
                    <div className="inventory-item-desc">"{state.weapon.desc}"</div>
                  </div>
                </div>
              </div>

              {state.armor && (
                <div
                  className="inventory-item-card inventory-item-card--equipped"
                  data-testid="inventory-equipped-armor"
                >
                  <div className="inventory-item-tap-area" style={{ cursor: 'default' }}>
                    <div className="inventory-item-icon">
                      <PixelIcon name="shield" size={24} />
                    </div>
                    <div className="inventory-item-info">
                      <div className="inventory-item-name-row">
                        <span className="inventory-item-name">{state.armor.name}</span>
                        <span className="item-badge item-badge--equipped">EQUIPPED ARMOR</span>
                      </div>
                      <div className="inventory-item-stats">
                        Defense -{state.armor.defense} DMG
                      </div>
                      <div className="inventory-item-desc">"{state.armor.desc}"</div>
                    </div>
                  </div>
                </div>
              )}

              {(!state.inventory || state.inventory.length === 0) && (
                <p className="inventory-empty">Pack is empty.</p>
              )}

              {state.inventory.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="inventory-item-card"
                  data-testid={`inventory-item-${idx}`}
                >
                    <button
                      type="button"
                      className="inventory-item-tap-area"
                      onClick={() => handleUseInventory(idx)}
                      data-testid={`inventory-item-tap-${idx}`}
                      title={
                        item.type === 'weapon'
                          ? 'Tap to equip weapon'
                          : item.type === 'armor'
                          ? 'Tap to equip armor'
                          : 'Tap to consume potion'
                      }
                    >
                      <div className="inventory-item-icon">
                        <PixelIcon
                          name={
                            item.type === 'weapon'
                              ? 'sword'
                              : item.type === 'armor'
                              ? 'shield'
                              : 'potion'
                          }
                          size={24}
                        />
                      </div>
                      <div className="inventory-item-info">
                        <div className="inventory-item-name-row">
                          <span className="inventory-item-name">{item.name}</span>
                          {item.instant && (
                            <span className="item-badge item-badge--instant">
                              INSTANT
                            </span>
                          )}
                          {item.type === 'weapon' && (
                            <span className="item-badge">WEAPON</span>
                          )}
                          {item.type === 'armor' && (
                            <span className="item-badge">ARMOR</span>
                          )}
                        </div>
                        <div className="inventory-item-stats">
                          {item.type === 'weapon' && item.weapon &&
                            `Skill ${item.weapon.skill}+ | ${item.weapon.damage} DMG`}
                          {item.type === 'armor' && item.armor &&
                            `Defense -${item.armor.defense} DMG`}
                          {(item.type === 'potion' || item.type === 'double_potion') &&
                            `Heal +${item.heal} HP`}
                        </div>
                        <div className="inventory-item-desc">"{item.desc}"</div>
                      </div>
                    </button>
                    <div className="inventory-item-actions">
                      <button
                        type="button"
                        className="pixel-btn pixel-btn--micro pixel-btn--primary"
                        onClick={() => handleUseInventory(idx)}
                        data-testid={`inventory-use-${idx}`}
                      >
                        {item.type === 'weapon'
                          ? 'EQUIP'
                          : item.type === 'armor'
                          ? 'EQUIP'
                          : 'USE'}
                      </button>
                      <button
                        type="button"
                        className="pixel-btn pixel-btn--micro pixel-btn--secondary"
                        onClick={() => handleDiscardInventory(idx)}
                        data-testid={`inventory-discard-${idx}`}
                      >
                        DISCARD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          </section>
        )}

        <footer className="viewport-footer">
          <a
            href="#changelog"
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              setShowChangelog(true);
            }}
          >
            v{APP_VERSION}
          </a>
          <span className="footer-dot">•</span>
          <a
            href="https://github.com/thisoldbear/the-dark-wood"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub
          </a>
        </footer>
      </main>

      {discardConfirmIndex !== null && state.inventory[discardConfirmIndex] && (
        <div
          className="modal-backdrop"
          onClick={cancelDiscard}
          data-testid="discard-modal"
        >
          <div
            className="game-card modal-card modal-card--small"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            data-testid="discard-modal-card"
          >
            <div className="screen-body screen-body--centered">
              <h2 className="screen-heading">DISCARD ITEM</h2>
              <p className="flavor-text">
                Are you sure you want to discard{' '}
                <strong>{state.inventory[discardConfirmIndex].name}</strong>?
              </p>
              <p className="combat-note">It will be lost in the woods forever.</p>
              <div className="action-bar">
                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary"
                  onClick={confirmDiscard}
                  data-testid="confirm-discard-btn"
                >
                  DISCARD
                </button>
                <button
                  type="button"
                  className="pixel-btn pixel-btn--secondary"
                  onClick={cancelDiscard}
                  data-testid="cancel-discard-btn"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangelog && (
        <div
          className="modal-backdrop"
          onClick={() => setShowChangelog(false)}
          data-testid="changelog-modal"
        >
          <div
            className="game-card modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="changelog-heading"
            data-testid="changelog-modal-card"
          >
            <div className="screen-body screen-body--centered">
              <h2 id="changelog-heading" className="screen-heading">
                CHANGELOG
              </h2>
              <div className="pixel-panel changelog-panel">
                <div className="changelog-entry">
                  <div className="changelog-version">v0.4.0 — 2026-11-03</div>
                  <ul className="changelog-list">
                    <li>Player inventory with item equip, instant use, and discard modal</li>
                    <li>Weighed down penalty when carrying more than 3 items</li>
                    <li>Chest encounter rework with pre-open choice, Take All, and rare locked chests</li>
                    <li>Equippable armor with incoming damage reduction</li>
                    <li>Full-page native scrolling and min-height layout stability</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.3.4 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Updated status header layout to column direction without center alignment</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.3.3 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Standardized weapon summary box across encounter and strike phases</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.3.2 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Updated enemy card stat labels to "Hits on:" and "Damage:"</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.3.1 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Updated weapon summary box text to "Current weapon:"</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.3.0 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Unified layout for lamp, sanctuary, respite, chest, and fallen screens with combat card design</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.2.6 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Removed border and double border from game card</li>
                    <li>Set dark-wood-viewport to solid var(--bg-card) background</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.2.5 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Removed ignited lamp banner from Sanctuary screen</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.2.4 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Removed progress section from Trail Pause / Respite screen</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.2.3 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Removed progress section from Sacred Lamp screen</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.2.2 — 2026-11-02</div>
                  <ul className="changelog-list">
                    <li>Updated lamp screen heading to "YOU FIND AN UNLIT LAMP" and button to "LIGHT THE LAMP"</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.2.1 — 2026-10-27</div>
                  <ul className="changelog-list">
                    <li>Fix flee keyboard shortcut (`F` / `f`) when buttons are focused</li>
                    <li>Remove redundant event listener re-registration</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.2.0 — 2026-10-27</div>
                  <ul className="changelog-list">
                    <li>Pause / Respite trail steps (18 atmospheric vignettes)</li>
                    <li>Pine tree pixel icon for trail exploration</li>
                  </ul>
                </div>
                <div className="changelog-entry">
                  <div className="changelog-version">v0.1.0 — 2026-10-27</div>
                  <ul className="changelog-list">
                    <li>10 Sacred Lamps quest to banish the dark gloom</li>
                    <li>Turn-based dice combat with 4 forest beasts</li>
                    <li>Woodland chest loot &amp; weapon equipment</li>
                    <li>CRT monochromatic pixel art &amp; keyboard controls</li>
                  </ul>
                </div>
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary"
                  onClick={() => setShowChangelog(false)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
