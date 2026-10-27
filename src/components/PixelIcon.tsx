export type IconName =
  | 'lamp'
  | 'skull'
  | 'sword'
  | 'swords'
  | 'potion'
  | 'chest'
  | 'rat'
  | 'zombie'
  | 'wolf'
  | 'spider'
  | 'tree';

interface PixelIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const PIXEL_GRIDS: Record<IconName, string[]> = {
  tree: [
    '......XXXX......',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '..XXXXXXXXXXXX..',
    '....XXXXXXXX....',
    '..XXXXXXXXXXXX..',
    '.XXXXXXXXXXXXXX.',
    '......XXXX......',
    '......XXXX......',
  ],
  lamp: [
    '......XXXX......',
    '.....X....X.....',
    '....XXXXXXXX....',
    '...X.XXXXXX.X...',
    '...X.XOOOOX.X...',
    '...X.XOOOOX.X...',
    '...X.XOOOOX.X...',
    '...X.XXXXXX.X...',
    '....XXXXXXXX....',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
  ],
  skull: [
    '....XXXXXXXX....',
    '..XXXXXXXXXXXX..',
    '.XXXXXXXXXXXXXX.',
    '.XXX..XXXX..XXX.',
    '.XXX..XXXX..XXX.',
    '.XXXXXXXXXXXXXX.',
    '..XXXXX..XXXXX..',
    '...XXXXXXXXXX...',
    '....X.X..X.X....',
    '....X.X..X.X....',
  ],
  sword: [
    '.............XX.',
    '............XXX.',
    '...........XXX..',
    '..........XXX...',
    '.........XXX....',
    '........XXX.....',
    '...XX..XXX......',
    '....XXXXX.......',
    '....XXXX........',
    '...XX..XX.......',
    '..XX....XX......',
    '.XX.............',
  ],
  swords: [
    '.XX..........XX.',
    '.XXX........XXX.',
    '..XXX......XXX..',
    '...XXX....XXX...',
    '....XXX..XXX....',
    '.....XXXXXX.....',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '..XXXX....XXXX..',
    '...XX......XX...',
    '..XX........XX..',
    '.XX..........XX.',
  ],
  potion: [
    '......XXXX......',
    '.....XXXXXX.....',
    '......XXXX......',
    '......XXXX......',
    '....XXXXXXXX....',
    '...XXOOOOOOXX...',
    '..XXOOOOOOOOXX..',
    '..XXOOOOOOOOXX..',
    '..XXOOOOOOOOXX..',
    '...XXOOOOOOXX...',
    '....XXXXXXXX....',
  ],
  chest: [
    '..XXXXXXXXXXXX..',
    '.XXOOOOOOOOOOXX.',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXOOOOXXXXX.',
    '.XXXXXOOOOXXXXX.',
    '.XXXXXXXXXXXXXX.',
    '.XXOOOOOOOOOOXX.',
    '.XXOOOOOOOOOOXX.',
    '..XXXXXXXXXXXX..',
  ],
  rat: [
    '....XX....XX....',
    '...XXXX..XXXX...',
    '..XXXXXXXXXXXX..',
    '.XXX.XXXXXX.XXX.',
    '.XXXXXXXXXXXXXX.',
    '..XXXX.XX.XXXX..',
    '....XXXXXXXX....',
    '..XXXX....XXXX..',
    '.XX..........XX.',
  ],
  zombie: [
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
    '...XX..XX..XX...',
    '...XXXXXXXXXX...',
    '....XX.XX.XX....',
    '..XXXXXXXXXXXX..',
    '.XX.XXXXXXXX.XX.',
    '.XX..XXXXXX..XX.',
    '.....XX..XX.....',
    '....XXX..XXX....',
  ],
  wolf: [
    '.XX..........XX.',
    '.XXXX......XXXX.',
    '.XXXXXXXXXXXXXX.',
    '..XXX.XXXX.XXX..',
    '..XXXXXXXXXXXX..',
    '...XXXXXXXXXX...',
    '....XX.XX.XX....',
    '....XXXXXXXX....',
    '...XXXX..XXXX...',
  ],
  spider: [
    '.XX..XXXXXX..XX.',
    '..XXXX.XX.XXXX..',
    '...XXXXXXXXXX...',
    '.XXXX.XXXX.XXXX.',
    'XXXXX.XXXX.XXXXX',
    '...XXXXXXXXXX...',
    '..XXXX.XX.XXXX..',
    '.XX..XX..XX..XX.',
    'XX............XX',
  ],
};

export function PixelIcon({ name, size = 48, className = '' }: PixelIconProps) {
  const rows = PIXEL_GRIDS[name];
  const height = rows.length;
  const width = rows[0].length;

  return (
    <svg
      data-testid={`pixel-icon-${name}`}
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      shapeRendering="crispEdges"
      className={`pixel-icon ${className}`}
      aria-hidden="true"
    >
      {rows.map((row, y) =>
        row.split('').map((cell, x) => {
          if (cell === '.') return null;
          const fill = cell === 'O' ? '#4D7C0F' : '#A3E635';
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}
