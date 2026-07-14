# My Day — AI-Powered Day, Todo & Roadmap OS

A cross-platform (Android + Web/Windows) personal productivity app combining a todo
system, a notes/links/ideas vault, category-based learning tracks with nested
AI-generated roadmaps, a daily timetable, deterministic auto-reschedule logic, and a
progress/weakness dashboard.

Built with **React Native + Expo (TypeScript)**, `expo-router`, and **Zustand**
(persisted to AsyncStorage, offline-first). AI roadmap generation goes through a
tiny **server-side Gemini proxy** (`server/`) — the API key never touches the client.

## Run it

```bash
npm install

npm start          # Expo dev server → press a for Android, w for web
npm run web        # web directly
npm test           # unit tests for the core engines (31 tests)
npm run typecheck  # tsc --noEmit
```

**Windows desktop:** `npx expo export --platform web` produces a static build in
`dist/` that can be wrapped with [Tauri](https://tauri.app) (point Tauri's
`frontendDist` at `dist/`).

**AI backend (optional):**

```bash
GEMINI_API_KEY=your-key npm run server   # starts the proxy on :8787
```

Then set the URL under **Settings → AI backend** in the app. Everything except AI
roadmap generation works fully offline.

## How it works

| Piece | Where | What it does |
|---|---|---|
| Data model | `src/types/index.ts` | Category, RoadmapNode (tree via `parentId`), Todo, TimeSlot, DayPlan, RecurringRule, Note, SavedLink, FutureIdea, ShiftLog, Settings |
| Roadmap engine | `src/lib/roadmap.ts` | Depth-first traversal, linear unlock sequencing, status recompute, AI-tree flattening (depth capped at 4) |
| Daily generator | `src/lib/scheduler.ts` | For each category with a study slot today: find the current unlocked node → create one todo, checklist-split if the node is bigger than the slot |
| Auto-reschedule | `src/lib/reschedule.ts` | Missed slot + grace period → shift to next open same-category slot today, else same slot tomorrow; every shift logged; after 3 shifts → `needs_review` |
| Analytics | `src/lib/analytics.ts` | Daily completion %, 7/30-day trend, streaks, per-category weakness score `(shifted+skipped)/total` |
| Store | `src/store/useAppStore.ts` | Single Zustand store, persisted with AsyncStorage; wires the engines to the UI |
| AI client | `src/api/client.ts` | Calls `/generate-roadmap` and `/generate-daily-todos` on the proxy |
| AI proxy | `server/index.mjs` | Zero-dependency Node server holding the Gemini key (portable to a Supabase Edge Function) |

The AI has exactly two jobs: generating a roadmap tree and (optionally) writing task
blurbs. **Scheduling math is deterministic app logic**, never the model.

The reschedule engine runs on app foreground and every minute
(`src/app/_layout.tsx`).

### Screens (`src/app/`)

Onboarding → Today (timetable + todos, "Generate today") → Categories → Category
detail (roadmap tree, AI generate/regenerate) → Node detail → Vault (Notes / Links /
Future ideas) → Dashboard (stats, trend, streak, weaknesses) → Settings (granularity,
grace period, streak target, backend URL, JSON export).

## Build-phase status (spec §9)

- ✅ Phase 1 — categories + manual todos + timetable (recurring slots included)
- ✅ Phase 2 — manual nested roadmap CRUD (reorder, edit, delete subtree, complete)
- ✅ Phase 3 — notes/links/future-ideas vault
- ✅ Phase 4 — Gemini roadmap generation via `server/` proxy
- ✅ Phase 5 — daily todo generator (roadmap → timetable → todos)
- ✅ Phase 6 — auto-reschedule engine (§6.3) with shift logs and 3-shift cap
- ✅ Phase 7 — dashboard, streaks, weakness analytics
- 🔜 Phase 8 — Tauri packaging for Windows (static web export already works)

### Deliberate deviations from the original brief

- **Persistence**: Zustand + AsyncStorage instead of expo-sqlite — identical
  offline-first behavior on Android *and* web/Tauri without SQLite-wasm setup, and
  the store layer isolates data access so SQLite/WatermelonDB can be swapped in
  later for sync.
- **Timetable editing** is form-based (add/delete/lock slots, recurring weekday
  rules) rather than drag-and-drop; drag-to-resize is a Phase 8+ enhancement.
- **Notifications** (`expo-notifications`) have a settings toggle but are not wired
  yet — planned alongside Phase 8.
