# EDENGROUPES Storefront

A frontend-first Algerian e-commerce storefront for professional tools, workshop equipment, and practical products.

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

- `artifacts/edengroupes-storefront/` — the React + Vite storefront artifact
- `artifacts/edengroupes-storefront/src/App.tsx` — storefront routes and UI entry point
- `artifacts/edengroupes-storefront/src/index.css` — storefront theme and global styles
- `attached_assets/generated_images/` — generated visual assets used by the storefront when present

## Architecture decisions

- The first release is frontend-only with realistic mock catalog data; there is no order, payment, auth, or inventory backend yet.
- Catalog discovery is organized around both product taxonomy and profession-based buying paths.
- French is the primary presentation language while the UI structure leaves room for a later Arabic RTL direction switch.

## Product

EDENGROUPES helps Algerian tradespeople, workshop owners, merchants, and practical buyers discover professional tools and equipment by search, category, profession, and brand. The storefront supports product browsing, product detail views, favorites, cart interactions, and a cash-on-delivery purchase handoff.

## User preferences

The user wants a premium, modern, highly professional storefront that remains recognizably EDENGROUPES and avoids fashion, luxury-boutique, generic marketplace, and dropshipping aesthetics.

## Gotchas

The storefront is a frontend prototype: any order or checkout action should communicate the cash-on-delivery flow without implying that a real order was submitted.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
