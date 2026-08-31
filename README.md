# Maison Dinamika

**A bilingual (FR/AR) ceramics & homeware storefront, with its own admin — one Next.js app, no separate backend.**

Built on [Payload CMS 3](https://payloadcms.com) embedded directly in [Next.js](https://nextjs.org)'s App Router: the storefront, the customer account area, and the content-management admin are all the same React/Node/TypeScript codebase, talking to one PostgreSQL database through Payload's Local API. Cash-on-delivery checkout, French-first with RTL Arabic support, English scaffolded for later.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Payload](https://img.shields.io/badge/Payload-3-000000?logo=payloadcms&logoColor=white)](https://payloadcms.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

---

## Contents

- [What's in the box](#whats-in-the-box)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Design decisions](#design-decisions)
- [Testing](#testing)
- [Roadmap to production](#roadmap-to-production)
- [License](#license)

## What's in the box

- **Storefront** — home page with a Three.js hero, a category-driven product catalogue (products and multi-item sets), a full-width auto-scrolling "Collection" showcase, cart, and cash-on-delivery checkout.
- **Customer accounts** — signup/login, order history and order detail, saved addresses (with a default used to prefill checkout), and a profile page (name/phone/password) — every route is authenticated server-side and strictly scoped to the signed-in customer.
- **Admin panel** — the full [Payload admin UI](https://payloadcms.com/docs/admin/overview) at `/admin`, for managing catalogue content, showcase collections, orders, and site-wide copy (homepage, about, contact, delivery fees), with zero extra code to maintain.
- **Localization** — French (default) and Arabic (`rtl: true`, mirrored layout throughout) are live; English is wired into the schema and routing, ready for translation.
- **Tunisia-specific delivery** — the 24 governorates and a configurable per-governorate delivery fee (plus a free-delivery threshold), managed entirely from the admin.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) |
| CMS / backend | [Payload CMS 3](https://payloadcms.com) (Local API, auth, access control, admin UI) |
| Database | PostgreSQL via `@payloadcms/db-postgres` |
| UI | React 19, [Tailwind CSS](https://tailwindcss.com), [Fraunces](https://github.com/undercasetype/Fraunces) + a sans body face |
| 3D | [Three.js](https://threejs.org) for the home page hero |
| Images | [Sharp](https://sharp.pixelplumbing.com) for Payload's upload derivatives |
| Language | TypeScript everywhere, types generated from the Payload schema |
| Testing | [Vitest](https://vitest.dev) (integration) + [Playwright](https://playwright.dev) (e2e) |

## Data model

Everything lives in Payload collections and globals — no separate ORM or schema file:

| Collection | Purpose |
| --- | --- |
| `users` | Admin accounts, gate access to `/admin` |
| `customers` | Storefront accounts (auth-enabled), each with saved `addresses[]` |
| `categories` | Drive the Produits navigation; assign products/sets, `order` sorts them |
| `products` | Individual items — price, stock, `isNew` flag, draft/published status |
| `sets` | Bundles with their own price and stock, independent of their `components[]` |
| `collections` | Showcase bands (title + overlay style + image gallery) for the `/collection` page |
| `orders` | COD order lifecycle: *placée → confirmée → expédiée → livrée / retournée / annulée* |
| `media` | Every uploaded image, with generated thumbnail/card/hero derivatives |

| Global | Purpose |
| --- | --- |
| `homepage`, `apropos`, `contact` | Editable copy for the corresponding pages |
| `site-settings` | Brand name, logo, per-governorate delivery fees, free-delivery threshold |

A few decisions baked into the schema:

- **Money** is authored as decimal TND in the admin (`28.500`) but summed as integer **millimes** wherever order totals are computed, so the Tunisian dinar's 3 decimal places never drift from repeated float addition.
- **Order line prices are frozen** at add-to-cart time and never recomputed from live catalogue data — an order page always shows exactly what was charged.
- **A set's stock is independent** of its components' stock — it does not auto-decrement the products inside it, matching how a boxed set is physically packed and sold.
- **Every account route re-derives the customer from the server-side session** — never from client input — and all reads/writes are scoped to that customer, enforced by Payload's own access control (`overrideAccess: false`), not just by UI conventions.

## Getting started

### Prerequisites

- Node.js `^18.20.2` or `>=20.9.0`
- pnpm `^9 || ^10 || ^11` (or npm — both are used interchangeably in this repo)
- Docker (for the local PostgreSQL instance), or your own Postgres

### 1. Clone and install

```bash
git clone <this-repo-url>
cd maison-dinamika
pnpm install
```

### 2. Configure the environment

Create a `.env` file in the project root with the two variables below (see [Environment variables](#environment-variables) for details):

```bash
DATABASE_URI=postgres://maison:maison@localhost:5432/maison_dinamika
PAYLOAD_SECRET=$(openssl rand -hex 32)
```

### 3. Start the database

Any PostgreSQL 16 instance works. The quickest local option is Docker:

```bash
docker run -d --name maison-dinamika-postgres \
  -e POSTGRES_USER=maison -e POSTGRES_PASSWORD=maison -e POSTGRES_DB=maison_dinamika \
  -p 5432:5432 postgres:16-alpine
```

Match `DATABASE_URI` in `.env` to whatever user/password/db/port you used.

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin. The first visit to `/admin` prompts you to create the first admin user.

### 5. Seed the essentials

From the admin, fill in:

- **Système → Paramètres** — delivery fees per governorate
- **Contenu → Accueil / À propos / Contact** — page copy
- A **Category**, a few **Products**, one **Set**, and a **Collection** — publish them (`status: Publié`) so the storefront can read them

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URI` | PostgreSQL connection string, e.g. `postgres://maison:maison@localhost:5432/maison_dinamika` |
| `PAYLOAD_SECRET` | Secret used to sign Payload's auth tokens — required, must be kept private |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm devsafe` | Dev server with a clean `.next/` cache |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` from the current schema |
| `pnpm generate:importmap` | Regenerate Payload's admin import map |
| `pnpm lint` | ESLint |
| `pnpm test:int` | Integration tests (Vitest) |
| `pnpm test:e2e` | End-to-end tests (Playwright) |
| `pnpm test` | Both test suites |

## Project structure

```
src/
├── app/
│   ├── (frontend)/[locale]/   # Storefront + account routes, one tree per locale
│   │   ├── collection/        # Showcase marquee page
│   │   ├── compte/            # Customer account area (orders, addresses, profile)
│   │   ├── produits/          # Catalogue
│   │   └── ...
│   └── (payload)/admin/       # Payload's admin UI, mounted as a route group
├── collections/                # Payload collection configs (schema + access control)
├── globals/                    # Payload global configs (site-wide singleton content)
├── components/                 # React components, grouped by feature area
├── lib/                        # i18n, pricing, auth, queries, server actions
└── payload.config.ts           # Payload's entry point — db, collections, localization
```

## Design decisions

- **Localization** is structural, not aspirational: every locale-facing string flows through `src/lib/i18n.ts`, and Arabic's `rtl: true` flag drives logical CSS properties (`ps-`, `ms-`, `border-s`, …) throughout, rather than one-off RTL overrides. Adding a language later is translation work, not a routing change.
- **Cart is guest-friendly**; only placing an order requires a signed-in customer, matching how Payload's `orders.create` access rule is written (`Boolean(user)`) — no schema change was needed to support either flow.
- **The admin owns all content** — copy, prices, images, delivery fees, collection titles and overlay styles. Nothing user-facing is hardcoded in the frontend that an editor should reasonably be able to change from `/admin`.

## Testing

```bash
pnpm test:int   # Vitest — integration tests against the Payload Local API
pnpm test:e2e   # Playwright — end-to-end browser tests
```

## Roadmap to production

- Vendor Three.js and fonts locally instead of a CDN, for the offline/privacy goal.
- Move Media storage to disk-backed or S3-compatible storage before deploying.
- Add rate-limiting on customer signup and order creation.

## License

MIT
