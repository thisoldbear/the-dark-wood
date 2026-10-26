# The Dark Wood (React Web Edition)

A turn-based gothic fantasy dice-rolling RPG featuring a retro 1-bit / lime-green phosphor aesthetic, built with React, TypeScript, and Vite.

## Core Mechanics
- **Objective**: Find and light **10 Sacred Lamps** (`0 -> 10`) to banish the darkness.
- **Starting Stats**: `13 HP` (`maxHp: 13`) and **Rusty Dagger** (`Skill: 3+`, `Damage: 2`).
- **Combat Math**:
  - **To-Hit Check**: `rollD6() >= attacker.skill`
  - **Damage Dealt**: `Math.max(1, weaponDamage - Math.floor(targetToughness / 2))`

## Scripts

```bash
# Run development server
npm run dev

# Run unit & component tests (Vitest + React Testing Library)
npm test

# Typecheck and build for production
npm run build

# Run linter
npm run lint
```
