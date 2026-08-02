# Drawing Register

An architectural drawing management app for maintaining a searchable sheet register, revisions, review status, issue dates, and project activity.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the drawing register API
- `lib/db/src/schema/drawings.ts` — PostgreSQL schema for drawings and activity
- `artifacts/api-server/src/routes/drawings.ts` — drawing CRUD and activity routes
- `artifacts/project-hub/src/pages/` — dashboard, register, and drawing detail screens
- `artifacts/project-hub/src/index.css` — blueprint-inspired visual theme

## Architecture decisions

- The API contract is OpenAPI-first and generated clients are used by the React app.
- Calendar-only due and issue dates are stored as PostgreSQL `date` values to avoid timezone shifts.
- Status transitions are explicit actions from drawing detail, with dashboard and activity caches refreshed after mutations.

## Product

- Dashboard summary by drawing status and discipline
- Searchable and filterable drawing register
- Drawing detail view with revision metadata and review/issue workflow
- Persistent PostgreSQL storage with recent activity feed

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
