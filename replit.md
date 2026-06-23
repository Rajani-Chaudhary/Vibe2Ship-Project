# Last-Minute Life Saver

An AI-powered productivity app that predicts deadline risks, breaks tasks into actionable steps, generates emergency rescue plans, and offers an AI productivity chat assistant.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, Framer Motion, TanStack Query, Wouter
- **Backend**: Express 5, Zod, OpenAPI-first (Orval codegen)
- **Auth + DB**: Firebase Auth + Firestore (client-side)
- **AI**: Google Gemini (`gemini-2.5-flash-lite`) via `@google/generative-ai`
- **Build**: esbuild (CJS bundle)

## Where things live

- `artifacts/web/` — React+Vite frontend
  - `src/pages/` — landing, login, signup, dashboard, tasks, task-detail, prioritize, assistant
  - `src/components/layout/` — DashboardLayout, ProtectedRoute
  - `src/contexts/AuthContext.tsx` — Firebase Auth state
  - `src/hooks/use-tasks.ts` — TanStack Query + Firestore CRUD
  - `src/lib/firebase.ts` — Firebase init
  - `src/lib/firestore.ts` — Firestore task CRUD
- `artifacts/api-server/src/routes/ai/index.ts` — All 5 Gemini AI endpoints
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-zod/` — Generated Zod schemas (from Orval codegen)
- `lib/api-client-react/` — Generated TanStack Query hooks (from Orval codegen)

## Architecture decisions

- **Firebase client-side only**: Auth and Firestore used directly in browser; no server-side Firebase. Tasks are stored per-user via `userId` field with Firestore `where` query.
- **OpenAPI-first**: API contract lives in `lib/api-spec`, Zod schemas and React Query hooks are generated via `pnpm --filter @workspace/api-spec run codegen`. Never hand-write these.
- **Gemini model**: Uses `gemini-2.5-flash-lite` as primary with retry logic (2 retries with backoff) on 503/429. Model chosen because `gemini-2.5-flash` has high demand / intermittent 503s.
- **Dark mode forced**: `document.documentElement.classList.add('dark')` in App.tsx — the app is always dark mode.
- **Demo data on signup**: 4 seeded tasks are created when a new user signs up via `signup.tsx`.

## Product

- **Landing page** — animated marketing page, sign up / sign in CTAs
- **Dashboard** — stats grid (total/pending/completed/high-risk), AI risk analysis of top task, productivity score, quick actions
- **Tasks** — full CRUD (create, edit, delete, filter by status/risk/search), color-coded risk + status badges
- **Task Detail** — AI risk analysis with score meter, AI breakdown into timeline subtasks, Rescue Mode for high-risk tasks (hour-by-hour schedule)
- **Prioritize** — AI ranks all pending tasks with urgency tags and overall strategy
- **AI Assistant** — chat with Gemini productivity coach; optional task context injection

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `gemini-2.5-flash` intermittently returns 503 under load; use `gemini-2.5-flash-lite` as primary
- Do NOT run `pnpm dev` at workspace root — use `restart_workflow` instead
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Firestore requires Firestore security rules to be configured in Firebase Console for production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
