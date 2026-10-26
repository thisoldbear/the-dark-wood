import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PixelIcon } from './PixelIcon';
import type { IconName } from './PixelIcon';
import { DiceBox } from './DiceBox';

describe('PixelIcon Component', () => {
  const icons: IconName[] = [
    'lamp',
    'skull',
    'sword',
    'swords',
    'potion',
    'chest',
    'rat',
    'zombie',
    'wolf',
    'spider',
  ];

  it.each(icons)('renders crisp pixel SVG for %s icon', (iconName) => {
    render(<PixelIcon name={iconName} />);
    const svg = screen.getByTestId(`pixel-icon-${iconName}`);
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('shape-rendering', 'crispEdges');
  });
});

describe('DiceBox Component', () => {
  it('renders rolled pip count and HIT! badge when hit is true', () => {
    render(<DiceBox roll={5} hit={true} />);
    const die = screen.getByTestId('dice-face');
    expect(die).toHaveAttribute('data-roll', '5');
    expect(die.querySelectorAll('[data-testid="dice-pip"]')).toHaveLength(5);

    const badge = screen.getByTestId('dice-result-badge');
    expect(badge).toHaveTextContent('HIT!');
    expect(badge).toHaveClass('dice-badge--hit');
  });

  it('renders rolled pip count and MISS badge when hit is false', () => {
    render(<DiceBox roll={2} hit={false} />);
    const die = screen.getByTestId('dice-face');
    expect(die).toHaveAttribute('data-roll', '2');
    expect(die.querySelectorAll('[data-testid="dice-pip"]')).toHaveLength(2);

    const badge = screen.getByTestId('dice-result-badge');
    expect(badge).toHaveTextContent('MISS');
    expect(badge).toHaveClass('dice-badge--miss');
  });

  it.each([1, 2, 3, 4, 5, 6])('renders exact pip count for roll=%i', (roll) => {
    const { unmount } = render(<DiceBox roll={roll} hit={true} />);
    const die = screen.getByTestId('dice-face');
    expect(die.querySelectorAll('[data-testid="dice-pip"]')).toHaveLength(roll);
    unmount();
  });
});
