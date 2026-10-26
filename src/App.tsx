import { useState, useEffect, useCallback } from 'react';
import {
  createInitialState,
  enterDarkWood,
  lightLamp,
  proceedFromRest,
  fightEncounter,
  fleeCombat,
  playerStrike,
  continueAfterPlayerStrike,
  continueAfterEnemyTurn,
  proceedFromCombat,
  takeChestItem,
  leaveChest,
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

function playRetroBeep(freq = 440, duration = 0.04) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio context errors in headless/test environments
  }
}

function getHeaderTitle(screen: GameState['screen']): string {
  switch (screen) {
    case 'enemy':
      return 'COMBAT';
    case 'lamp':
      return 'SACRED LAMP';
    case 'rest':
      return 'SANCTUARY';
    case 'chest':
      return 'CHEST';
    case 'victory':
      return 'VICTORY';
    case 'game_over':
      return 'GAME OVER';
    default:
      return 'THE DARK WOOD';
  }
}

export function App({ initialState, rng = Math.random }: AppProps) {
  const [state, setState] = useState<GameState>(
    () => initialState ?? createInitialState()
  );

  const handleEnter = useCallback(() => {
    playRetroBeep(520, 0.06);
    setState((prev) => enterDarkWood(prev, rng));
  }, [rng]);

  const handleLightLamp = useCallback(() => {
    playRetroBeep(660, 0.08);
    setState((prev) => lightLamp(prev, rng));
  }, [rng]);

  const handleProceedFromRest = useCallback(() => {
    playRetroBeep(480, 0.05);
    setState((prev) => proceedFromRest(prev, rng));
  }, [rng]);

  const handleFight = useCallback(() => {
    playRetroBeep(540, 0.06);
    setState((prev) => fightEncounter(prev, rng));
  }, [rng]);

  const handleFlee = useCallback(() => {
    playRetroBeep(260, 0.08);
    setState((prev) => fleeCombat(prev, rng));
  }, [rng]);

  const handleStrike = useCallback(() => {
    playRetroBeep(600, 0.06);
    setState((prev) => playerStrike(prev, rng));
  }, [rng]);

  const handleContinueStrike = useCallback(() => {
    playRetroBeep(400, 0.05);
    setState((prev) => continueAfterPlayerStrike(prev, rng));
  }, [rng]);

  const handleContinueEnemy = useCallback(() => {
    playRetroBeep(460, 0.05);
    setState((prev) => continueAfterEnemyTurn(prev));
  }, []);

  const handleProceedCombat = useCallback(() => {
    playRetroBeep(520, 0.05);
    setState((prev) => proceedFromCombat(prev, rng));
  }, [rng]);

  const handleTakeChest = useCallback(
    (index?: number) => {
      playRetroBeep(680, 0.07);
      setState((prev) => takeChestItem(prev, index, rng));
    },
    [rng]
  );

  const handleLeaveChest = useCallback(() => {
    playRetroBeep(320, 0.05);
    setState((prev) => leaveChest(prev, rng));
  }, [rng]);

  const handleRestart = useCallback(() => {
    playRetroBeep(500, 0.06);
    setState(restartGame());
  }, []);

  // Optional keyboard shortcuts (Enter/Space for primary action, Escape/F for secondary)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state.screen === 'title') handleEnter();
        else if (state.screen === 'lamp') handleLightLamp();
        else if (state.screen === 'rest') handleProceedFromRest();
        else if (state.screen === 'victory' || state.screen === 'game_over')
          handleRestart();
        else if (state.screen === 'chest') handleTakeChest();
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
  }, [
    state,
    handleEnter,
    handleLightLamp,
    handleProceedFromRest,
    handleRestart,
    handleTakeChest,
    handleFight,
    handleStrike,
    handleContinueStrike,
    handleContinueEnemy,
    handleProceedCombat,
    handleFlee,
  ]);

  const isDoubleBorderScreen =
    state.screen === 'title' ||
    state.screen === 'victory' ||
    state.screen === 'game_over';

  return (
    <div className="dark-wood-viewport">
      <main
        className={`game-card ${
          isDoubleBorderScreen ? 'game-card--double-border' : ''
        }`}
        data-testid="game-card"
      >
        {state.screen !== 'title' && (
          <header className="status-header" data-testid="status-header">
            <div className="status-header__left">
              <span className="status-header__title">
                {getHeaderTitle(state.screen)}
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
          <div className="screen-body screen-body--centered">
            <div className="icon-showcase">
              <PixelIcon name="lamp" size={64} />
            </div>
            <h2 className="screen-heading">SACRED LAMP FOUND!</h2>
            <div className="pixel-banner">
              PROGRESS: {state.lamps} / 10 LIT
            </div>
            <p className="flavor-text">
              Light this lamp to dispel the suffocating black gloom.
            </p>
            <div className="action-bar">
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={handleLightLamp}
              >
                LIGHT
              </button>
            </div>
          </div>
        )}

        {/* 3. REST / SANCTUARY SCREEN */}
        {state.screen === 'rest' && (
          <div className="screen-body screen-body--centered">
            <div className="icon-showcase">
              <PixelIcon name="lamp" size={64} />
            </div>
            <h2 className="screen-heading">YOU REST BY THE LIGHT</h2>
            <div className="pixel-banner">
              LAMP {state.lamps} OF 10 IGNITED!
            </div>
            <p className="heal-log">
              Recovered +{state.restHeal ?? 0} HP! (HP: {state.hp}/{state.maxHp})
            </p>
            <p className="flavor-text">
              The holy flame keeps beasts at bay. Warmth returns to your limbs.
            </p>
            <div className="action-bar">
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={handleProceedFromRest}
              >
                PROCEED
              </button>
            </div>
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
                    Skill: {state.combat.enemy.skill}+ | Dmg:{' '}
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
                        Weapon: {state.weapon.name}
                      </div>
                      <div className="weapon-summary-stats">
                        Hits on {state.weapon.skill}+ | Damage:{' '}
                        {state.weapon.damage}
                      </div>
                    </div>
                  </div>
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
                        {state.weapon.name} vs Toughness{' '}
                        {state.combat.enemy.toughness}
                      </div>
                      <div className="weapon-summary-stats">
                        Hits on {state.weapon.skill}+ | Weapon Damage:{' '}
                        {state.weapon.damage}
                      </div>
                    </div>
                  </div>
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

        {/* 5. WOODLAND CHEST SCREEN */}
        {state.screen === 'chest' && state.chest && (
          <div className="screen-body">
            <div className="chest-header-row">
              <PixelIcon name="chest" size={52} />
              <div>
                <h2 className="screen-heading">WOODLAND CHEST</h2>
                <p className="chest-status">{state.chest.message}</p>
              </div>
            </div>

            <div className="chest-items-list">
              {state.chest.items.map((item, idx) => {
                const isSelected = idx === state.chest?.selectedIndex;
                return (
                  <div key={`${item.name}-${idx}`} className="chest-loot-wrapper">
                    <button
                      type="button"
                      data-testid={`chest-item-${idx}`}
                      className={`chest-item-card ${
                        isSelected ? 'chest-item-card--selected' : ''
                      }`}
                      onClick={() => handleTakeChest(idx)}
                    >
                      <div className="chest-item-card__icon">
                        <PixelIcon
                          name={item.type === 'weapon' ? 'sword' : 'potion'}
                          size={36}
                        />
                      </div>
                      <div className="chest-item-card__body">
                        <div className="chest-item-card__name">{item.name}</div>
                        <div className="chest-item-card__stats">
                          {item.type === 'weapon' && item.weapon
                            ? `Weapon | Skill ${item.weapon.skill}+ | Damage ${item.weapon.damage}`
                            : `Potion | Heal +${item.heal} HP`}
                        </div>
                        <div className="chest-item-card__desc">"{item.desc}"</div>
                      </div>
                      <div className="chest-item-card__cta">TAKE</div>
                    </button>

                    {item.type === 'weapon' && (
                      <div
                        className="current-weapon-replace-box"
                        data-testid="current-weapon-replace-info"
                      >
                        <div className="current-weapon-replace-label">
                          Current Weapon:
                        </div>
                        <div className="current-weapon-replace-details">
                          <span className="current-weapon-replace-name">
                            {state.weapon.name}
                          </span>
                          <span className="current-weapon-replace-stats">
                            Skill {state.weapon.skill}+ | Damage{' '}
                            {state.weapon.damage}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="action-bar">
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => handleTakeChest()}
              >
                TAKE
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--secondary"
                onClick={handleLeaveChest}
              >
                LEAVE CHEST
              </button>
            </div>
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
          <div className="screen-body screen-body--centered">
            <div className="icon-showcase">
              <PixelIcon name="skull" size={64} />
            </div>
            <h2 className="screen-heading">YOU HAVE FALLEN</h2>
            <p className="death-cause">
              {state.deathCause ?? 'Claimed by the Dark Wood'}
            </p>
            <div className="pixel-banner">
              Lanterns Lit: {state.lamps} / 10
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
