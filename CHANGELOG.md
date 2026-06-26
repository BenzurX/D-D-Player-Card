# Changelog

All notable changes to Combat Sheet are documented here.

---

## [0.6] — 2026-06-25

### Added
- Gold D20 icon on loading and splash screen (was light tan)
- Fluid cross-fade transition between loading screen and welcome screen
- Pinned Actions header shows sword icon and capitalized "Attack/Attacks"
- Feature types in Add/Edit sheet changed to **Feat**, **Origin**, **Species**
- Pinned feature cards show a type icon on the right: Bookmark (Feat), Origin (Origin), User-hexagon (Species)
- CHANGELOG.md
- .gitignore

### Removed
- Attack count badge (× N attacks) from the Actions section header
- Stats / Damage input field from Reaction add/edit form
- Size input field from Character Details popover (Explore tab)
- Dark Vision card and concept card experiments from Explore tab

---

## [0.5] — 2026-06-25
_Commit: `1a9e5c8` — redesign Explore Character section; remove Size card from Defend tab_

### Added
- Explore tab Character section redesigned: compact 3-card grid (Size, Darkvision, Movement) matching Passive Scores layout
- Passive Score cards given colored icons (eye / zoom-question / bulb)
- Size ruler icon updated to `ti-ruler-2`

### Removed
- Character/Size section removed from Defend tab entirely

### Fixed
- Replaced missing `ti-ikosaedr` splash icon with `ti-dice-6-filled`
- Fixed `ti-flask` → `ti-flask-2` in category config

---

## [0.4] — 2026-06-25
_Commit: `5ecb77e` — add proficiency segmented controls to skill and saving throw popovers_

### Added
- Segmented proficiency controls (None / Proficient / Expertise) on skill detail popovers
- Segmented proficiency controls on saving throw popovers
- Improved skill card readability

---

## [0.3] — 2026-06-25
_Commit: `9620868` — large scale UI/UX changes_

### Added
- Resistance and immunity chip system (Defend tab)
- Advantage / disadvantage tracking for skills and saving throws
- Pinned Actions system — pin any ability to the top of the Act tab
- Spell slot tracker with pip UI and Long Rest reset
- Combined Explore tab Character section — Size, Darkvision, and all movement speeds in one edit sheet
- Combined Passive Scores popover — Perception, Investigation, Insight, and Stealth with override support
- Species field added to character (editable in New Character and Character Stats; shown in header)
- Act tab converted from static HTML to dynamically rendered

---

## [0.2] — 2026-06-25
_Commits: `cc34bdf`, `2f29657` — README_

### Added
- README with app overview, feature list, and usage guide

---

## [0.1] — 2026-06-24
_Commit: `90c03a1` — initial commit_

### Added
- Core app scaffolding: Act, React, Defend, Explore tabs
- Character creation and multi-character switcher
- Ability cards with categories (Attack, Magic, Items, Features) × (Action, Bonus)
- Extra actions panel
- Character Stats editor (ability scores, proficiency, AC, HP, speed)
- D20 loading screen and splash screen
- Dark parchment visual theme (Cinzel + Crimson Text fonts, Tabler icons)
- localStorage persistence
