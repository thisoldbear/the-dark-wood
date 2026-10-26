interface DiceBoxProps {
  roll: number;
  hit: boolean;
}

// 3x3 pip positions for D6 faces 1..6
const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
};

export function DiceBox({ roll, hit }: DiceBoxProps) {
  const clampedRoll = Math.max(1, Math.min(6, roll));
  const pips = PIP_POSITIONS[clampedRoll] || PIP_POSITIONS[1];

  return (
    <div className="dice-box-container" data-testid="dice-box">
      <div
        className="dice-face"
        data-testid="dice-face"
        data-roll={clampedRoll}
        aria-label={`Rolled ${clampedRoll}`}
      >
        <div className="dice-grid">
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => {
              const hasPip = pips.some(([c, r]) => c === col && r === row);
              return (
                <div key={`${row}-${col}`} className="dice-cell">
                  {hasPip && (
                    <span className="dice-pip" data-testid="dice-pip" />
                  )}
                </div>
              );
            })
          )}
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
