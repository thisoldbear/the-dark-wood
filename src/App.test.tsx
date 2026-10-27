import './index.css';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from './App';
import { APP_VERSION, createInitialState, createEnemy, enterDarkWood } from './engine';
import type { GameState } from './types';

function dieToFloat(face: number, sides: number): number {
  return (face - 0.5) / sides;
}

function createSequenceRng(values: number[]) {
  let idx = 0;
  return () => {
    const val = values[idx % values.length];
    idx++;
    return val;
  };
}

describe('App - Screen Flows & Interactive UI', () => {
  it('renders Title screen with double border, crossed swords icon, rules summary, and ENTER button', () => {
    render(<App />);
    expect(screen.getByText('THE DARK WOOD')).toBeInTheDocument();
    expect(screen.getByText('A Fantasy Dice RPG')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Find & light 10 sacred lamps to banish the deep darkness/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/HP: 13 \| Weapon: Rusty Dagger/i)).toBeInTheDocument();
    expect(screen.getByTestId('pixel-icon-swords')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ENTER/i })).toBeInTheDocument();
  });

  it('clicking ENTER transitions to first enemy encounter (Rat or Zombie) and shows persistent status header', async () => {
    const user = userEvent.setup();
    render(<App rng={() => 0.2} />); // 0.2 -> Dire Rat

    await user.click(screen.getByRole('button', { name: /ENTER/i }));

    expect(screen.getByText('COMBAT')).toBeInTheDocument();
    expect(screen.getByText(/HP: 13\/13/i)).toBeInTheDocument();
    expect(screen.getByText(/L: 0\/10/i)).toBeInTheDocument();
    expect(screen.getByText('Dire Rat')).toBeInTheDocument();
    expect(screen.getByText(/A monster blocks the trail!/i)).toBeInTheDocument();
    expect(screen.getByText(/A quick, rabid vermin\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /FIGHT/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /FLEE/i })).toBeInTheDocument();
  });

  it('handles full combat flow: FIGHT -> player_turn -> STRIKE -> enemy_defeated -> PROCEED', async () => {
    const user = userEvent.setup();
    // Sequence:
    // 1. enterDarkWood: 0.2 -> Dire Rat (2 HP, Toughness 1)
    // 2. fightEncounter: player rolls 6, enemy rolls 2 -> player_turn
    // 3. playerStrike: player rolls 5 (hits on 3+ for 2 dmg -> slays Rat!), heal rolls 2 on D3
    // 4. proceedFromCombat: rolls 1 on D6 -> lamp screen
    const rng = createSequenceRng([
      0.2,
      dieToFloat(6, 6),
      dieToFloat(2, 6),
      dieToFloat(5, 6),
      dieToFloat(2, 3),
      dieToFloat(1, 6),
    ]);

    render(<App rng={rng} />);

    await user.click(screen.getByRole('button', { name: /ENTER/i }));
    await user.click(screen.getByRole('button', { name: /FIGHT/i }));

    // Now on player_turn (lamps: 0 -> fleeing inflicts 1-3 damage)
    expect(screen.getByText(/YOUR TURN TO STRIKE!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Initiative won! \(You: 6 vs Enemy: 2\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Fleeing inflicts 1-3 damage\./i)).toBeInTheDocument();

    // Click STRIKE
    await user.click(screen.getByRole('button', { name: /STRIKE/i }));

    // Enemy defeated phase
    expect(screen.getByText('VICTORY!')).toBeInTheDocument();
    expect(screen.getByText(/The Dire Rat was slain\./i)).toBeInTheDocument();
    expect(screen.getByText(/Recovered \+2 HP!/i)).toBeInTheDocument();

    // Click PROCEED -> Lamp screen
    await user.click(screen.getByRole('button', { name: /PROCEED/i }));
    expect(screen.getByText('SACRED LAMP FOUND!')).toBeInTheDocument();
  });

  it('displays player_strike_result and enemy_turn_result with DiceBox when enemy survives strike', async () => {
    const user = userEvent.setup();
    // Sequence:
    // 1. enterDarkWood: 0.8 -> Zombie (4 HP, Toughness 2, Skill 4+, Dmg 2)
    // 2. fightEncounter: player 5 vs enemy 2 -> player_turn
    // 3. playerStrike: player rolls 4 -> Hit for 1 dmg (3/4 HP remaining) -> player_strike_result
    // 4. continueAfterPlayerStrike: enemy rolls 5 -> Hit for 2 dmg (11/13 HP) -> enemy_turn_result
    // 5. continueAfterEnemyTurn: -> player_turn
    const rng = createSequenceRng([
      0.8,
      dieToFloat(5, 6),
      dieToFloat(2, 6),
      dieToFloat(4, 6),
      dieToFloat(5, 6),
    ]);

    render(<App rng={rng} />);
    await user.click(screen.getByRole('button', { name: /ENTER/i }));
    await user.click(screen.getByRole('button', { name: /FIGHT/i }));
    await user.click(screen.getByRole('button', { name: /STRIKE/i }));

    // player_strike_result
    expect(screen.getByText('PLAYER ATTACK')).toBeInTheDocument();
    expect(screen.getByTestId('dice-face')).toHaveAttribute('data-roll', '4');
    expect(screen.getByTestId('dice-result-badge')).toHaveTextContent('HIT!');
    expect(screen.getByText(/Enemy HP remaining: 2\/4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /CONTINUE/i }));

    // enemy_turn_result
    expect(screen.getByText(/ZOMBIE ATTACKS/i)).toBeInTheDocument();
    expect(screen.getByTestId('dice-face')).toHaveAttribute('data-roll', '5');
    expect(screen.getByTestId('dice-result-badge')).toHaveTextContent('HIT!');
    expect(screen.getByText(/Your HP: 11\/13/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /CONTINUE/i }));
    expect(screen.getByText('YOUR TURN TO STRIKE!')).toBeInTheDocument();
  });

  it('handles FLEE action in combat: extinguishes 1 lamp when lamps > 0, or inflicts D3 HP damage when lamps == 0', async () => {
    const user = userEvent.setup();
    const initialWithLamps: GameState = {
      ...enterDarkWood(createInitialState(), () => 0.2),
      lamps: 4,
      hp: 11,
    };

    const { unmount } = render(
      <App initialState={initialWithLamps} rng={() => dieToFloat(1, 6)} />
    );
    await user.click(screen.getByRole('button', { name: /FLEE/i }));

    expect(screen.getByText('FLED COMBAT')).toBeInTheDocument();
    expect(
      screen.getByText(/A sacred lamp goes out in the gloom!/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Lanterns Lit: 3 \/ 10/i)).toBeInTheDocument();
    expect(screen.getByText(/HP: 11\/13/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /PROCEED/i }));
    expect(screen.getByText('SACRED LAMP FOUND!')).toBeInTheDocument();
    unmount();

    // Now test fleeing with 0 lamps lit -> loses D3 HP
    const initialZeroLamps: GameState = {
      ...enterDarkWood(createInitialState(), () => 0.2),
      lamps: 0,
      hp: 11,
    };
    const rngZero = createSequenceRng([dieToFloat(2, 3), dieToFloat(1, 6)]);
    render(<App initialState={initialZeroLamps} rng={rngZero} />);
    await user.click(screen.getByRole('button', { name: /FLEE/i }));

    expect(screen.getByText('FLED COMBAT')).toBeInTheDocument();
    expect(
      screen.getByText(/You broke away, taking 2 damage\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Current HP: 9\/13/i)).toBeInTheDocument();
    expect(screen.getByText(/L: 0\/10/i)).toBeInTheDocument();
  });

  it('handles Sacred Lamp and Sanctuary (Rest) screens', async () => {
    const user = userEvent.setup();
    const initialLampState: GameState = {
      ...createInitialState(),
      screen: 'lamp',
      hp: 8,
      lamps: 2,
    };
    const rng = createSequenceRng([dieToFloat(3, 3), dieToFloat(1, 6)]);

    render(<App initialState={initialLampState} rng={rng} />);

    expect(screen.getByText('SACRED LAMP FOUND!')).toBeInTheDocument();
    expect(screen.getByText('PROGRESS: 2 / 10 LIT')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Light this lamp to dispel the suffocating black gloom\./i
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /LIGHT/i }));

    // Sanctuary / Rest screen
    expect(screen.getByText('SANCTUARY')).toBeInTheDocument();
    expect(screen.getByText('YOU REST BY THE LIGHT')).toBeInTheDocument();
    expect(screen.getByText('LAMP 3 OF 10 IGNITED!')).toBeInTheDocument();
    expect(screen.getByText(/Recovered \+3 HP! \(HP: 11\/13\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /The holy flame keeps beasts at bay\. Warmth returns to your limbs\./i
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /PROCEED/i }));
    expect(screen.getByText('SACRED LAMP FOUND!')).toBeInTheDocument();
  });

  it('handles Chest screen: shows current weapon details when a weapon is found and replaces it on TAKE', async () => {
    const user = userEvent.setup();
    const initialChestState: GameState = {
      ...createInitialState(),
      screen: 'chest',
      hp: 9,
      chest: {
        items: [
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
        ],
        selectedIndex: 0,
        message: 'An ancient ironbound coffer rests among the twisted roots.',
      },
    };

    render(
      <App initialState={initialChestState} rng={() => dieToFloat(1, 6)} />
    );

    expect(screen.getByText('WOODLAND CHEST')).toBeInTheDocument();
    expect(
      screen.getByText(
        'An ancient ironbound coffer rests among the twisted roots.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Silver Rapier')).toBeInTheDocument();

    // Displays details of the current weapon that taking this weapon will replace
    const replaceBox = screen.getByTestId('current-weapon-replace-info');
    expect(replaceBox).toHaveTextContent(/Current Weapon/i);
    expect(replaceBox).not.toHaveTextContent(/Replaces Current Weapon/i);
    expect(replaceBox).toHaveTextContent(/Rusty Dagger/i);
    expect(replaceBox).toHaveTextContent(/Skill 3\+/i);
    expect(replaceBox).toHaveTextContent(/Damage 2/i);

    // No CYCLE button on chest screen
    expect(
      screen.queryByRole('button', { name: /CYCLE/i })
    ).not.toBeInTheDocument();

    // Take the weapon -> equips Silver Rapier and transitions to next encounter (lamp)
    await user.click(screen.getByRole('button', { name: /^TAKE$/i }));
    expect(screen.getByText('SACRED LAMP FOUND!')).toBeInTheDocument();
    expect(screen.getByText(/Silver Rapier \(3\+ \/ 4 DMG\)/i)).toBeInTheDocument();
  });

  it('does not show weapon replacement info when chest contains a potion', () => {
    const potionChestState: GameState = {
      ...createInitialState(),
      screen: 'chest',
      chest: {
        items: [
          {
            name: 'Elixir of Life',
            type: 'potion',
            heal: 3,
            desc: 'Restores +3 HP.',
          },
        ],
        selectedIndex: 0,
        message: 'An ancient ironbound coffer rests among the twisted roots.',
      },
    };

    render(<App initialState={potionChestState} />);
    expect(screen.getByText('Elixir of Life')).toBeInTheDocument();
    expect(
      screen.queryByTestId('current-weapon-replace-info')
    ).not.toBeInTheDocument();
  });

  it('handles Victory screen when 10th lamp is lit and PLAY AGAIN resets game', async () => {
    const user = userEvent.setup();
    const ninthLampState: GameState = {
      ...createInitialState(),
      screen: 'lamp',
      hp: 10,
      lamps: 9,
    };

    render(<App initialState={ninthLampState} />);
    await user.click(screen.getByRole('button', { name: /LIGHT/i }));

    expect(screen.getByText('DARK WOOD CONQUERED')).toBeInTheDocument();
    expect(
      screen.getByText(
        /All 10 lanterns shine in harmony! The ancient curse is shattered\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Final HP: 10\/13/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AGAIN/i }));
    expect(screen.getByText('THE DARK WOOD')).toBeInTheDocument();
  });

  it('handles Game Over screen when player HP reaches 0 and RESTART resets game', async () => {
    const user = userEvent.setup();
    const doomedState: GameState = {
      ...createInitialState(),
      screen: 'enemy',
      hp: 1,
      lamps: 4,
      combat: {
        enemy: createEnemy('spider'),
        phase: 'encounter',
        logMessage: 'A monster blocks the trail!',
      },
    };

    // Fight: player rolls 1, spider rolls 6 (spider wins initiative), spider rolls 5 (hits for 4 dmg) -> 0 HP -> game_over
    const rng = createSequenceRng([
      dieToFloat(1, 6),
      dieToFloat(6, 6),
      dieToFloat(5, 6),
    ]);
    render(<App initialState={doomedState} rng={rng} />);
    await user.click(screen.getByRole('button', { name: /FIGHT/i }));

    expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    expect(screen.getByText('YOU HAVE FALLEN')).toBeInTheDocument();
    expect(
      screen.getByText(/Slain by Giant Spider/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Lanterns Lit: 4 \/ 10/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /RESTART/i }));
    expect(screen.getByText('THE DARK WOOD')).toBeInTheDocument();
  });

  it('supports LEAVE CHEST button and keyboard shortcuts (Enter to advance, F to flee)', async () => {
    const user = userEvent.setup();
    const rng = createSequenceRng([
      0.1, // Dire Rat
      dieToFloat(1, 3), // Flee with 0 lamps -> 1 damage
      dieToFloat(6, 6), // Next encounter = 6 (chest)
      dieToFloat(3, 6), // 1 item: Hunting Spear
      dieToFloat(1, 6), // Leave chest -> Lamp screen
    ]);

    render(<App rng={rng} />);
    expect(screen.getByText('THE DARK WOOD')).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(screen.getByText('Dire Rat')).toBeInTheDocument();

    await user.keyboard('f');
    expect(screen.getByText('FLED COMBAT')).toBeInTheDocument();

    await user.keyboard(' ');
    expect(screen.getByText('WOODLAND CHEST')).toBeInTheDocument();
    expect(
      screen.getByText(
        'An ancient ironbound coffer rests among the twisted roots.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Hunting Spear')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /LEAVE CHEST/i }));
    expect(screen.getByText('SACRED LAMP FOUND!')).toBeInTheDocument();
  });

  it('allows F hotkey to flee combat even when a button has focus', async () => {
    const user = userEvent.setup();
    const initial = {
      ...enterDarkWood(createInitialState(), () => 0.1),
      hp: 10,
      lamps: 2,
    };
    render(<App initialState={initial} rng={() => dieToFloat(1, 6)} />);

    const fightButton = screen.getByRole('button', { name: /FIGHT/i });
    fightButton.focus();
    expect(fightButton).toHaveFocus();

    await user.keyboard('f');
    expect(screen.getByText('FLED COMBAT')).toBeInTheDocument();
  });

  it('renders pause/respite screen with pine tree icon, flavor vignette, and advances on PROCEED', async () => {
    const user = userEvent.setup();
    const pauseState: GameState = {
      ...createInitialState(),
      screen: 'pause',
      pauseMessage: 'A cold breeze whispers through the hollow branches.',
      lamps: 2,
    };

    render(<App initialState={pauseState} rng={() => dieToFloat(1, 6)} />);

    expect(screen.getByText('THE TRAIL')).toBeInTheDocument();
    expect(screen.getByText('A MOMENT OF RESPITE')).toBeInTheDocument();
    expect(screen.getByText('PROGRESS: 2 / 10 LIT')).toBeInTheDocument();
    expect(
      screen.getByText('A cold breeze whispers through the hollow branches.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('pixel-icon-tree')).toBeInTheDocument();

    const proceedBtn = screen.getByRole('button', { name: /PROCEED/i });
    expect(proceedBtn).toBeInTheDocument();

    await user.click(proceedBtn);
    expect(screen.getByText('SACRED LAMP FOUND!')).toBeInTheDocument();
  });

  it('maintains a fixed, identical game-card height across all screens and combat phases', () => {
    const statesToTest: GameState[] = [
      createInitialState(),
      { ...createInitialState(), screen: 'lamp', lamps: 3 },
      { ...createInitialState(), screen: 'rest', lamps: 4, restHeal: 2 },
      {
        ...createInitialState(),
        screen: 'pause',
        pauseMessage: 'A cold breeze whispers through the hollow branches.',
      },
      {
        ...createInitialState(),
        screen: 'enemy',
        combat: {
          enemy: createEnemy('wolf'),
          phase: 'encounter',
          logMessage: 'A monster blocks the trail!',
        },
      },
      {
        ...createInitialState(),
        screen: 'enemy',
        combat: {
          enemy: createEnemy('wolf'),
          phase: 'player_strike_result',
          lastPlayerRoll: 5,
          playerHit: true,
          playerDamageDealt: 2,
          logMessage: 'Hit Shadow Wolf!',
        },
      },
      {
        ...createInitialState(),
        screen: 'chest',
        chest: {
          items: [
            { name: 'Elixir of Life', type: 'potion', heal: 3, desc: 'Restores +3 HP.' },
            {
              name: 'Broadsword',
              type: 'weapon',
              weapon: { name: 'Broadsword', skill: 4, damage: 5, desc: 'Devastating heavy steel.' },
              desc: 'Devastating heavy steel.',
            },
          ],
          selectedIndex: 0,
          message: 'Choose your loot.',
        },
      },
      { ...createInitialState(), screen: 'victory', lamps: 10 },
      { ...createInitialState(), screen: 'game_over', hp: 0, deathCause: 'Slain by Giant Spider' },
    ];

    for (const st of statesToTest) {
      const { unmount } = render(<App initialState={st} />);
      const card = screen.getByTestId('game-card');
      const styles = window.getComputedStyle(card);
      expect(styles.height).toBe('560px');
      expect(styles.minHeight).toBe('560px');
      expect(styles.maxHeight).toBe('560px');
      unmount();
    }
  });

  it('uses borderless buttons and a strict 2-green monochromatic palette', () => {
    const chestState: GameState = {
      ...createInitialState(),
      screen: 'chest',
      chest: {
        items: [
          { name: 'Elixir of Life', type: 'potion', heal: 3, desc: 'Restores +3 HP.' },
          {
            name: 'Broadsword',
            type: 'weapon',
            weapon: { name: 'Broadsword', skill: 4, damage: 5, desc: 'Devastating heavy steel.' },
            desc: 'Devastating heavy steel.',
          },
        ],
        selectedIndex: 0,
        message: 'Choose your loot.',
      },
    };

    render(<App initialState={chestState} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    for (const btn of buttons) {
      const style = window.getComputedStyle(btn);
      expect(style.borderTopWidth).toBe('0px');
      expect(style.borderBottomWidth).toBe('0px');
      expect(style.borderLeftWidth).toBe('0px');
      expect(style.borderRightWidth).toBe('0px');
    }

    const rootStyles = window.getComputedStyle(document.documentElement);
    expect(rootStyles.getPropertyValue('--lime-primary').trim()).toBe('');
    expect(rootStyles.getPropertyValue('--lime-olive').trim()).toBe('');
    expect(rootStyles.getPropertyValue('--bg-recessed').trim()).not.toBe('#1a2e05');
    expect(rootStyles.getPropertyValue('--bg-hover-dark').trim()).not.toBe('#263815');
  });

  it('defines a < 768px responsive rule setting game-card to 80vh without cropping text', () => {
    render(<App />);
    const styleSheets = Array.from(document.styleSheets);
    const mediaRules: CSSMediaRule[] = [];
    for (const sheet of styleSheets) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes('767px')) {
          mediaRules.push(rule);
        }
      }
    }
    expect(mediaRules.length).toBeGreaterThan(0);
    const cssText = mediaRules.map((r) => r.cssText).join(' ');
    expect(cssText).toContain('.game-card');
    expect(cssText).toMatch(/height:\s*80vh/);
    expect(cssText).toMatch(/overflow-y:\s*auto/);
  });

  it('renders version link and GitHub repo link outside game wrapper, opening changelog modal on click and closing on CLOSE/Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    const versionLink = screen.getByRole('link', { name: `v${APP_VERSION}` });
    expect(versionLink).toBeInTheDocument();

    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/thisoldbear/the-dark-wood'
    );
    expect(githubLink).toHaveAttribute('target', '_blank');

    expect(screen.queryByTestId('changelog-modal')).not.toBeInTheDocument();

    await user.click(versionLink);
    expect(screen.getByTestId('changelog-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CHANGELOG' })).toBeInTheDocument();
    expect(screen.getByText(/v0.2.0 — 2026-10-27/i)).toBeInTheDocument();

    // Close via CLOSE button
    await user.click(screen.getByRole('button', { name: /CLOSE/i }));
    expect(screen.queryByTestId('changelog-modal')).not.toBeInTheDocument();

    // Open and close via Escape key
    await user.click(versionLink);
    expect(screen.getByTestId('changelog-modal')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('changelog-modal')).not.toBeInTheDocument();
  });
});
