interface DiceBoxProps {
  roll: number;
  hit: boolean;
}

// 3x3 pip grid indices (0..8) for D6 faces 1..6
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function DiceBox({ roll, hit }: DiceBoxProps) {
  const clampedRoll = Math.max(1, Math.min(6, roll));
  const pips = PIPS[clampedRoll] || PIPS[1];

  return (
    <div className="dice-box-container" data-testid="dice-box">
      <div
        className="dice-face"
        data-testid="dice-face"
        data-roll={clampedRoll}
        aria-label={`Rolled ${clampedRoll}`}
      >
        <div className="dice-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="dice-cell">
              {pips.includes(i) && (
                <span className="dice-pip" data-testid="dice-pip" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        data-testid="dice-result-badge"
        className={`dice-badge ${hit ? 'dice-badge--hit' : 'dice-badge--miss'}`}
      >
        {hit ? 'HIT!' : 'MISS'}
      </div>
    </div>
  );
}
