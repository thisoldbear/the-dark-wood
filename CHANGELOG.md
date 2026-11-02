# Changelog

All notable changes to **The Dark Wood** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-11-02

### Changed
- Standardized UI layout across encounter steps: Sacred Lamp, Sanctuary (Rest), Moment of Respite (Trail Pause), Woodland Chest, and Fallen (Game Over) screens now follow the structured combat layout, reusing the top summary card (`.enemy-card`) for icon and titles and the interactive content box (`.combat-box`) for descriptions, loot, and actions.

## [0.2.6] - 2026-11-02

### Changed
- Removed border and double-border styling from the game card.
- Updated dark wood viewport background to solid `var(--bg-card)`.

## [0.2.5] - 2026-11-02

### Removed
- "LAMP X OF 10 IGNITED!" banner from Sanctuary (Rest) screen.

## [0.2.4] - 2026-11-02

### Removed
- Progress section from the Trail Pause / Respite screen ("A MOMENT OF RESPITE").

## [0.2.3] - 2026-11-02

### Removed
- Progress section from the Sacred Lamp screen.

## [0.2.2] - 2026-11-02

### Changed
- Sacred Lamp screen heading changed to "You find an unlit lamp" and button text changed to "Light the Lamp".

## [0.2.1] - 2026-10-27

### Fixed
- Flee keyboard shortcut (`F` / `f`) now functions properly when interface buttons have focus.
- Prevent redundant keydown listener re-registration on every render.

### Removed
- Dead `cycleChestItem` helper from game engine.

## [0.2.0] - 2026-10-27

### Added
- **Pause / Respite Steps**: Added 18 atmospheric flavor vignettes along the trail, triggering deterministically every 4 encounters to pace the journey between combat, lamps, and chests.
- **Tree Pixel Art**: New pine tree pixel icon for trail pause screens.

## [0.1.0] - 2026-10-27

### Added
- **Core Game**: The Dark Wood fantasy dice RPG web edition.
- **Quest Objective**: Search the wood and ignite 10 Sacred Lamps to dispel the darkness.
- **Combat System**: Turn-based D6 dice combat with 4 forest creatures (Dire Rat, Zombie, Shadow Wolf, Giant Spider).
- **Sanctuary / Rest**: Recover HP when discovering and lighting lamps.
- **Loot & Equipment**: Woodland chests with restorative draughts and weapons (Rusty Dagger, Spiked Club, Hunting Spear, Broadsword, Silver Rapier).
- **Retro CRT Aesthetic**: Monochromatic green pixel palette with custom pixel icons and dice animations.
- **Keyboard Shortcuts**: Advance encounters with `Space` / `Enter`, flee combat with `F`.
