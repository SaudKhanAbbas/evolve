# Development Guide

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
npm run dev
```

## Commands

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Dev server with HMR                  |
| `npm run build`        | Type-check + production build        |
| `npm run preview`      | Serve the production build           |
| `npm run lint`         | ESLint over the repo                 |
| `npm run format`       | Prettier write                       |
| `npm run format:check` | Prettier check (used before commits) |
| `npm test`             | Run the full Vitest suite once       |
| `npm run test:watch`   | Vitest in watch mode                 |

## Workflow

Development proceeds in small milestones (see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)). Each
milestone:

1. Is implemented and verified locally (`build` + `lint` + `format:check` + `test` green)
2. Gets reviewed via `git diff`
3. Becomes exactly one meaningful commit — no micro-commits, no grab-bag commits

### Commit Style

Conventional Commits, concise and specific:

```
feat(sim): add genome mutation and energy economy
fix(render): correct device-pixel-ratio scaling on resize
chore: scaffold Vite + TypeScript project
docs: add simulation design notes
```

Commits are made only after explicit approval. Pushes happen only on instruction.

## Code Conventions

- TypeScript strict mode; no `any`, no non-null assertions unless justified
- Single quotes, no semicolons, 100-char width (enforced by Prettier)
- No comments explaining _what_ — code should; comments only for _why_
- Simulation code must stay DOM-free (headless-testable)

## Testing Plan

From Phase 1: Vitest unit tests for genetics/mutation/statistics, plus headless stability runs
(e.g., "population survives 10k ticks without exploding or dying out").

## Deployment

GitHub Pages via GitHub Actions on every push to `main`. The site is fully static — free hosting,
no backend.
