# Nuqat

**نُقَط** — Master Quran memorization through the power of spaced repetition.

A local-first Progressive Web App that combines a spatial Quran reader (coming soon) with FSRS-powered review scheduling. One flashcard per page (604 total), manual grading via hesitations/mistakes/forgets, and all data stored on your device.

## Overview

Nuqat helps you memorize the Quran by:

- **Modeling the Quran by page** — Each Mushaf page is a separate flashcard with its own stability, difficulty, and due date
- **FSRS scheduling** — The Free Spaced Repetition Scheduler optimizes when you review for efficient long-term retention
- **Recitation-quality grading** — Instead of raw grades, you log hesitations (1 pt), mistakes (4 pt), and forgets (5 pt); these map to FSRS ratings (Again / Hard / Good / Easy)
- **Spatial consistency** — The reader preserves page layout so memorizers can rely on visual anchors

### Key Features

- **Local-first** — All data in IndexedDB; no accounts, no cloud
- **Offline PWA** — Works completely offline
- **Reader (Future)** — Quran with open-quran-view for spatial memorization
- **Review dashboard** — Stats (New, Learning, Review, Due Today, Due This Week), surah/juz grid, card lists
- **Manage content** — Add or remove flashcards by page range, surah, or juz
- **Backup & Restore** — Export/import your progress as JSON
- **Light & dark themes**

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Dexie.js (IndexedDB)
- **State**: Zustand
- **Spaced Repetition**: ts-fsrs
- **Quran**: open-quran-view, quran-meta, quran-search-engine
- **Testing**: Vitest with React Testing Library

## Getting Started

### Prerequisites

- Node.js >= 20.9.0 (recommended)

### Installation

```bash
git clone https://github.com/N-alsharafi/QFSRS-lite.git
cd QFSRS-lite
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-time setup

1. Complete the **questionnaire** — Set desired retention, daily review limit, and add your memorized content (by page range, surah, or juz with confidence levels)
2. Use **Review** to see due cards and start a session
3. Use **Settings** to adjust config or manage (add/remove) flashcards

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Home
│   ├── reader/            # Quran reader (currently an empty page)
│   ├── review/             # Review dashboard (stats, surah grid, due cards)
│   ├── questionnaire/      # Onboarding (config + content)
│   ├── settings/           # Config + manage content
│   └── what-is-this/       # Technical implementation article
├── components/
│   ├── review/             # ReviewStats, SurahGrid, CardList, ReviewStatsModal
│   ├── questionnaire/      # AddToCartForm, SelectionCart
│   └── ui/                 # IslamicPattern, ThemeSwitcher
├── lib/
│   ├── db/                 # Dexie schema, exportImport
│   ├── quran/              # metadata, initializeCards, questionnaireCalculations
│   ├── review/             # scheduleReview (FSRS)
│   └── stores/             # theme, reader, memorization, srs, sync-outbox
└── types/                  # Card, Config, ReviewLog
```

## Configuration

- **Desired retention** (70%–98%): Target probability you remember a card at review time. Higher = longer intervals; lower = more frequent reviews.
- **Daily review limit**: Target pages to review per day (advisory; app shows all due cards)
- **Fuzz**: ±5% random variation on due dates to spread reviews

## Grading Rubric


| Disfluency    | Penalty | FSRS Grade |
| ------------- | ------- | ---------- |
| Hesitation    | 1 each  | —          |
| Mistake       | 4 each  | —          |
| Forget        | 5 each  | —          |
| **Total ≥10** | —       | Again      |
| **Total ≥6**  | —       | Hard       |
| **Total ≥3**  | —       | Good       |
| **Total <3**  | —       | Easy       |


## Scripts

- `npm run dev` — Development server
- `npm run build` — Production build (static export)
- `npm run start` — Production server
- `npm test` — Run tests
- `npm run test:coverage` — Tests with coverage
- `npm run lint` — ESLint

## Acknowledgments

- **FSRS** by Jarrett Ye
- **ts-fsrs** library
- **open-quran-view** for Quran rendering
- **quran-meta** for surah/juz metadata

## License

[Your License Here]