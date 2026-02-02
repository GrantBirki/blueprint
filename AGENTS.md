# AGENTS.md

## Project overview
Blueprint is a static, browser-based Balatro calculator and deck builder. It is a fork of EFHIII's balatro-calculator with the goal of improving usability, correctness, and long-term maintainability. The site emulates Balatro's scoring rules, Joker effects, hand upgrades, and modifiers so players can experiment with builds, compare outcomes, and share setups via URL encoding.

## User experience summary (from current site behavior)
- Two-column layout: left run state (Jokers, hand, score), right tabs for Jokers, Cards, Hands, and Breakdown.
- Optimization toggles live in Settings and control the expensive Joker/hand search routines.
- Joker selection supports variants (foil, holographic, polychrome, disabled) with grid search and tooltips.
- Card selection allows constructing an explicit 5-card hand and applying card modifiers.
- Hands tab exposes per-hand levels, played counts, and a toggle to invert played-hand flags.
- Breakdown tab shows a step-by-step scoring ledger for each Joker and the final chip/mult totals.
- Run state is encoded into the URL query string so a configuration can be shared.

## Tech stack
- Astro + TypeScript (static output) at repo root.
- Runtime is TypeScript modules in `src/runtime/` with a single entrypoint (`src/runtime/index.ts`); shared logic ports live in `src/logic/`.
- Web Workers for compute-heavy optimization.
- Sprite sheets and raster assets for card art and UI.

## Architecture and data flow
- **src/pages/index.astro**: Canonical HTML layout. Mirrors the original structure and loads `src/runtime/index.ts`.
- **public/style.css**: Pixel-style UI, card sprite positioning, layout grid, tooltip styling, and theme colors.
- **src/runtime/index.ts**: Runtime entrypoint; attaches global handlers and initializes URL state parsing.
- **src/runtime/main.ts**: UI state, tab switching, hand definitions/levels, and interaction logic that updates the run panel and score preview.
- **src/runtime/manageWorkers.ts**: Orchestrates worker tasks, optimization toggles, and run-level flags (Plasma Deck, The Flint, The Eye, Observatory).
- **src/runtime/cards.ts**: Joker/card metadata, tooltip strings, and visual/text formatting helpers for card modifiers and Joker variants.
- **src/runtime/breakdown.ts**: Scoring logic and breakdown rendering; computes chip/mult progression for a selected hand and Joker sequence.
- **src/runtime/hand-url.ts**: Encodes/decodes run state into a compact URL-safe string and restores state on page load (using helpers from `src/logic/handUrl.ts`).
- **src/runtime/hoverCard.ts**: 3D hover tilt effect for card thumbnails (wraps `src/logic/hoverCard.ts`).
- **src/runtime/state.ts**: Shared run-state object used across runtime modules.
- **src/runtime/data.ts**: Hand definitions and hand color palette.
- **src/runtime/format.ts**: Number formatting helpers for chips/mult.
- **src/sim/balatro-sim.ts**: Simulation engine and numeric helpers used by optimization/scoring.
- **src/worker/worker.ts**: Web Worker entry point for off-thread simulation and optimization.
- **public/assets/**: Sprite sheets and UI images.
- **src/logic/**: TypeScript ports of isolated logic (starting with hover/URL helpers).

## Core concepts and state
- **Jokers**: Represented by type identifiers plus optional edition/variant (foil, holographic, polychrome, disabled). Joker order affects final scoring.
- **Cards**: Standard 52-card deck plus modifiers (e.g., bonus, mult, wild, glass, steel, stone, gold, luck, seals).
- **Hands**: Poker hands with levels, played counts, and base chips/mult values. Level upgrades affect base scoring.
- **Run modifiers**: The Flint, Plasma Deck, The Eye, Observatory, and “Minimize Score” toggle (grouped in Settings).
- **URL encoding**: State is serialized to a compact bitstream and encoded into query params (`h`/`hand`) for shareable links.

## Performance model
- Optimization is intentionally “slow” due to combinatorial search and is offloaded to workers.
- UI responsiveness relies on keeping scoring updates on the main thread and heavy computation in workers.

## External integrations
- Google Analytics tag included in `index.html`.
- Discord invite link in the footer.

## Development workflow
- Run the Astro dev server with `script/server` (requires Node from nodenv).
- Build static output with `script/build` (Astro output in `dist/`).
- `script/lint` is still a placeholder.
- Unit tests (added in this repo) are run via `script/test` (Deno).
- Node runtime is pinned via `.node-version` (use nodenv).

## Testing
- Deno is used as the test runtime.
- Unit tests cover isolated, deterministic logic and runtime wrappers (e.g., hover transforms and URL encoding helpers).
- Coverage reporting is enforced in `script/test`.

## Where to start for changes
- UI and layout changes: `src/pages/index.astro` and `public/style.css`.
- Joker/card data or tooltip text: `src/runtime/cards.ts`.
- Scoring logic or breakdown behavior: `src/runtime/breakdown.ts` and `src/sim/balatro-sim.ts`.
- Optimization logic or parallelism: `src/runtime/manageWorkers.ts`, `src/worker/worker.ts`.
- Shareable state: `src/runtime/hand-url.ts` and `src/logic/handUrl.ts`.

## Design goals for future improvements
- Preserve Balatro’s visual language and card art fidelity.
- Keep computations deterministic and debuggable.
- Improve modularity and testability without changing gameplay logic.

## Migration status (Astro + TypeScript)
- Astro is canonical at repo root; runtime TS entrypoint is `src/runtime/index.ts`.
- Worker and simulator are module-based TypeScript under `src/worker` and `src/sim`.
- TypeScript logic ports live in `src/logic` and are backed by unit tests.
- Next steps: remove remaining `// @ts-nocheck`, add shared types, and replace inline handlers with module bindings.

## Migration guidance (TypeScript + modern framework)

### Recommendation (best fit)
**Astro + TypeScript + Vite** is the best overall fit for this project.
- The site is mostly static UI with heavy client-side interaction. Astro serves static HTML by default, then you opt-in to client-side islands for the calculator UI.
- Vite gives fast TS builds, worker bundling, and modern asset handling.
- You can keep most logic in plain TS modules with minimal framework lock-in, and only introduce UI components where helpful.
- Astro makes it easy to output a fully static site (ideal for GitHub Pages) while still supporting Web Workers.

### Alternatives (trade-offs)
- **React + Vite**: Strong ecosystem and UI patterns, but full client-side app by default; heavier than needed for a mostly static page.
- **Next.js**: Overkill for a static calculator without server features. Adds routing/SSR complexity you likely don’t need.
- **SvelteKit**: Great for smaller apps with less boilerplate and good performance. Good option if you want a more component-driven refactor.
- **Vanilla TS + Vite (no framework)**: Lowest overhead; useful if you want to preserve the global-function style and migrate incrementally without componentizing.

### Migration strategy (incremental, low-risk)
1. **Introduce Vite + TypeScript** while keeping HTML/CSS mostly intact.
2. **Convert JS files to TS modules** one-by-one (start with pure logic like `balatro-sim` and `hand-url`).
3. **Replace global state with explicit module exports** (types + functions) to improve testability.
4. **Keep Web Workers** but move to `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`.
5. **Gradually introduce components** if using Astro/React/Svelte (e.g., tabs, hand row, joker grid).
6. **Add typed models** (Card, Joker, Hand, RunState) and replace magic indices with enums.

### Key TypeScript boundaries
- **Data models**: `types.ts` for enums and interfaces (Card, Joker, HandState, RunState).
- **Simulation**: `sim/` for compute-heavy logic; keep it DOM-free and unit-testable.
- **UI**: `ui/` for DOM bindings or component wrappers; minimal logic here.
- **Workers**: `worker/` for optimization tasks; share types with `sim/`.

### Why Astro is favored here
- Static-first output matches the current deployment pattern.
- Keeps the UI lean while allowing you to componentize parts of the calculator.
- Easy integration with Web Workers and typed modules.
- You can still use React or Svelte inside Astro if needed.
