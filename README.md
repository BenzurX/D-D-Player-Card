# Combat Sheet

A mobile-first D&D quick-reference companion designed for use at the table. No install required — open `index.html` in any modern browser and you're ready to play.

---

## Features

- A companion app for quick access info for your D&D character. Each tab (Act, React, Defend, and Explore) let you focus on the most important things you want to remember and keep in front of you when playing.
- **Multiple characters** — create and switch between characters on the fly
- **Act tab** — quick-access buttons for Actions, Bonus Actions, and common Extra Actions (Dash, Dodge, Disengage, Hide, Help, Ready)
- **React tab** — manage your Reactions with custom cards
- **Defend tab** — AC display, resistances/immunities, and Saving Throw bonuses
- **Explore tab** — character traits, passive scores, and a full Skills list with auto-calculated bonuses
- **Persistent storage** — everything saves automatically to your browser's localStorage; no account or server needed

---

## Getting Started

1. Open `index.html` in a browser (Chrome or Safari recommended on mobile)
2. Tap **Create Character** on the welcome screen
3. Fill in your character's name, class, race, level, and ability scores
4. Hit **Save** — your character is ready

To switch characters or create another, tap the avatar icon in the top-left corner.

---

## Tabs

### Act
Tap any category button (Attack, Magic, Items, Features) to view your saved abilities for that action type. Tap a card to read the full description. Tap **+ Add** to create a new ability card.

The **Extra Actions** section at the bottom has built-in rule reminders for common actions — tap any to read the full rules text.

### React
Lists your Reaction abilities. Tap **+ Add Reaction** to create one. Tap any card to read or edit it.

### Defend
- **AC card** — displays your Armor Class at a glance
- **Saving Throws** — auto-calculated from your ability scores and proficiency bonus; tap any row to set proficiency or enter a manual override; tap the circle to quickly toggle proficiency
- **Resistances / Immunities** — damage types you resist or are immune to; tap **+** to add, tap **✕** on a chip to remove

### Explore
The Explore tab is organized into three sections:

**Character** — key traits at a glance:
- **Size** — tap to open Character Stats and change your size (Small / Medium / Large)
- **Darkvision** — tap to set range in feet; displays "None" if not set
- **Movement** — tap to set walk, fly, climb, and swim speeds

**Passive Scores** — auto-calculated from your ability scores and skill proficiencies:
- Passive Perception, Passive Investigation, Passive Insight (each = 10 + skill bonus)

**Skills** — all 18 skills in a 2-column grid with auto-calculated bonuses:
- **Circle icon** (left of each card) — tap to cycle through None → Proficient → Expertise
- **Tap the card** to open a popover where you can set proficiency and enter a manual override bonus
- Proficient bonuses display in amber; manual overrides display in blue with an asterisk (`*`)

---

## Editing a Character

Tap your character name or avatar in the top header to open the Hero Summary. From there you can:
- Upload a portrait photo
- See your ability scores, HP, AC, Speed, and Prof bonus at a glance
- Tap **Edit Stats** to open the Character Stats editor

The stats editor lets you update:
- Name, class, level
- Ability scores (STR, DEX, CON, INT, WIS, CHA) — modifier updates live as you type
- Armor Class (AC), Max HP, Speed, Proficiency bonus
- Size (Small / Medium / Large)

---

## Data Storage

All data is stored in `localStorage` under the keys `dnd_characters` and `dnd_current_char`. Clearing your browser's site data will erase your characters. To back up, copy the localStorage values from your browser's DevTools.

---

## Tech Stack

- Vanilla JavaScript (no framework)
- CSS custom properties for theming
- [Tabler Icons](https://tabler.io/icons) webfont
- [Google Fonts](https://fonts.google.com) — Cinzel & Crimson Text
- localStorage for persistence
