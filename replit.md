# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: Arrears & Budget Manager

A working personal finance system to manage arrears (rent, utilities, fines, child support, personal debts), bills, income, tasks, communications log, and weekly tracking.

### Artifacts

- `artifacts/api-server` — Express 5 + Drizzle API at `/api/*`
- `artifacts/arrears-blueprint` — React + Vite + wouter + TanStack Query + shadcn/ui at `/`

### Database tables (`lib/db/src/schema`)

- `incomeSources` — id, name, amount, frequency, notes
- `bills` — id, provider, category, amount, frequency, dueDay, accountRef, autopay, notes
- `arrearsItems` — creditor, balance, ongoing/arrears charge & frequency, riskLevel, status, internal plan (summary/objective/workingPlan/communicationPosition/evidenceLinks) and external sanitised plan (acknowledgement/paymentIntent/stagedReduction/reviewPoints/channel)
- `tasks` — title, bucket (pay/contact/file/review/negotiate/watch), status, priority, dueDate, optional creditorTag/arrearsItemId
- `commsEntries` — occurredAt, channel, creditor, who, outcome, nextStep
- `weeklyEntries` — weekStart (unique), plannedIn/Out, actualIn/Out, notes

### API surface

CRUD under `/api/{income,bills,arrears,tasks,comms}`, upsert under `/api/weeks`, plus dashboard endpoints `/api/dashboard/{summary,arrears-matrix,upcoming}`. All numeric DB columns are `numeric` and converted via `n()`/`toWeekly()` helpers in `artifacts/api-server/src/lib/calc.ts`.

### Frontend pages

`/` Dashboard, `/income-bills`, `/arrears`, `/arrears/:id` (with internal vs external plan tabs), `/tasks`, `/comms`, `/weekly`. Generated hooks come from `@workspace/api-client-react`; Zod schemas from `@workspace/api-zod`.

### Seeding

`pnpm --filter @workspace/scripts exec tsx ./src/seed.ts` (idempotent — skips if income rows exist).
