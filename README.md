# lostark-bible-ui

Custom UI overlay for LostArk Bible.

A userscript that extracts character data directly from the DOM and renders a fully personalized frontend layer on top of the original site.

---

## Why?

LostArk Bible is an extremely powerful analysis tool.

It exposes deep system-level information about a character, including progression systems, efficiency breakdowns, and contribution metrics, similar in spirit to Korean community tools like LOAWA and Lopec.

The problem wasn't the amount of information.

It was the presentation.

I wanted something that felt closer to a real MMORPG armory experience:
more immersive, character-focused, visually stylized, and easier to read at a glance.

So this project reinterprets LostArk Bible's data through a completely custom frontend inspired by:

- classic MMORPG UI aesthetics
- Lineage II item iconography
- modern armory-style presentation layers

The goal is to keep the power of LostArk Bible while presenting the information in a cleaner and more immersive way.

---

## Features

- Live DOM extraction from LostArk Bible character pages
- Custom frontend overlay rendered on top of the original page
- Fully custom equipment icon set inspired by Lineage II
- Runtime parsing for:
  - character info
  - gear progression
  - advanced honing
  - accessories
  - engravings
  - skills
  - gems
  - bracelets and ability stones
  - ark grid / ark passive systems
  - combat power data
  - progression metrics

---

## Tech

- Vanilla JavaScript userscript
- Runtime DOM parsing
- Custom overlay renderer
- Zero backend
- Browser-side execution only

---

## Status

Work in progress.

Currently validating DOM extraction across multiple character builds and progression states to ensure stable parsing for every major Lost Ark system.

---

## Inspiration

- LostArk Bible → data source
- Korean Lost Ark Armory → layout direction
- Lineage II → visual identity and iconography
