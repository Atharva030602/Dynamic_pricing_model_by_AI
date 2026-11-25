# What every file and folder is for

A map of the repository that Vercel builds, and of what lives in Vercel itself (settings and storage).
Live site: https://dynamicpricingmodelbyai.vercel.app

## How Vercel uses this repository

| Step | What runs | What comes out |
|---|---|---|
| Push to `main` on GitHub | Vercel starts a build | — |
| `npm run build` | `scripts/build-api.mjs`, then TypeScript check, then Vite | `api/_lib/core.mjs` (engines bundled for the server) and `dist/` (the website) |
| Serve | `dist/` as static files; each `api/*.js` as its own serverless function | The site and `/api/...` endpoints |

## Root files

| File | Stores | Used for |
|---|---|---|
| `vercel.json` | Build command, output folder, rewrites, function time limit | Tells Vercel how to build; rewrites `/robots.txt` → `/api/robots`, `/api/licence/:id` → `/api/licence?id=`, `/api/accounts` → `/api/db?resource=accounts`; 30 s per function |
| `package.json` / `package-lock.json` | Dependencies and scripts (`dev`, `build`, `build:api`, `seal`) | Installing and building; the lock file pins exact versions |
| `index.html` | The single HTML page | Entry point; loads `src/main.tsx` |
| `vite.config.ts` | Vite settings | Builds the front end; proxies `/api` to the local dev server |
| `tsconfig.json` | TypeScript settings | Type checking during the build |
| `README.md` | Formulas, product note, edge cases, FAQ, AI tools used, how to run | The assignment write-up |
| `.gitignore` | Files never committed | Keeps out `node_modules`, `dist`, `.env`, `.data`, Figma HTML exports, caches |
| `public/` | `favicon.svg` | Copied as-is into the site |

## `api/` — serverless functions (one function per file)

| File | Endpoint | Stores / reads | Used for |
|---|---|---|---|
| `works.js` | `/api/works` | Redis `tf:works` | List published works; publish a new one |
| `feed.js` | `/api/feed` | Works, events, posts | What other devices poll every 4 s |
| `posts.js` | `/api/posts` | Redis `tf:posts` | Community questions and shared stories |
| `insight.js` | `/api/insight` | Nothing stored; calls Gemini | Reading companion (why, who, fact, ask) with fallback |
| `review.js` | `/api/review` | Nothing stored; calls Gemini | AI second opinion on a draft (±10 per score) |
| `category.js` | `/api/category` | Nothing stored; calls Gemini | Checks a proposed new category |
| `licence.js` | `/api/licence/:id` | Reads works | Machine-readable licence JSON (/licence/v1) |
| `mcp.js` | `/api/mcp` | Writes use events; reads agent replica | MCP server for AI agents (7 tools) |
| `robots.js` | `/robots.txt` | — | robots.txt with a `License:` pointer |
| `db.js` | `/api/db`, `/api/accounts` | Accounts database (below) | Read master / human / agent / log; also handles accounts via the rewrite |

## `api/_lib/` — shared server code (not functions; the underscore keeps them private)

| File | Used for |
|---|---|
| `core.mjs` | **Generated** by `scripts/build-api.mjs` from `src/engine` and `src/data`: valuation, similarity, licence, seal, MCP logic. Do not edit by hand |
| `db.mjs` | Accounts database: master, replication log, human and agent replicas, password hashing, sign-in, saved stories, manifests |
| `accounts.mjs` | Handler for create, sign in, sync saved, read manifest, delete |
| `admin.mjs` | Checks the `ADMIN_KEY` header (full emails in the master view) |
| `store.mjs` | Works, events and posts storage (Redis or memory) |
| `http.mjs` | CORS headers, host detection, JSON body reading |

## `src/` — the website (React)

| Folder / file | Stores | Used for |
|---|---|---|
| `main.tsx`, `App.tsx` | Routes and the page shells (reader header, studio header) | Which screen shows for each `#/…` address |
| `store.tsx` | The browser's state, saved to localStorage `twofold:v5` | Profile, creator, drafts, likes, saved stories, history; syncs tabs and polls the feed |
| `index.css` | Design tokens (colours, fonts, motion) | The whole look |
| `screens/` | 16 screen files | Onboarding, SignIn, Home, WorkPage (+WorkExtras), Community, Report, Database, CreatorGate, CreatorJoin, Hub, Write, Licence, Earnings, Audience, Demo |
| `engine/` | Pure logic, shared with the server | `valuation` (value and prices), `demand`, `similarity` (search), `rating` (stars), `licence`, `seal` (SHA-256 + ECDSA), `mcp` |
| `data/` | Seed content | Works, creators, photos, categories, community posts, seed seals, sample drafts |
| `lib/` | Browser helpers | `accounts.ts` (sign-up, sign-in, saved sync; tokens in localStorage `twofold:accounts`), `importDoc.ts` (PDF/DOCX import) |
| `ui/` | Shared components | `kit.tsx` (buttons, chips, stars, router), `Engage.tsx` (like, save, share), `Market.tsx` (markets strip) |
| `charts/` | Charts | Daily earnings bars |

## `server/` and `scripts/` — not deployed as functions

| File | Used for |
|---|---|
| `server/dev.mjs` | Local development: runs every `api/*.js` with Express beside Vite (`npm run dev`) |
| `server/core.ts` | Entry file that `build-api.mjs` bundles into `api/_lib/core.mjs` |
| `scripts/build-api.mjs` | Bundles the engines for the server (runs in every build) |
| `scripts/figma_export.py` | Captures every screen state into the three Figma HTML files |
| `scripts/figma_design_system.py` | Adds the design-system frame to those files |
| `scripts/e2e.py`, `search_test.ts`, `calibrate.ts`, `seal-seeds.ts` | Tests and one-off tools: flows, search, price ranges, seed seals |
| `scripts/shot.py`, `capture_figma.py`, `deck_shots.py` | Screenshot helpers for decks and Figma |

## `figma/` and `docs/`

| Path | Used for |
|---|---|
| `figma/scripter-prototype.ts` | Paste into the Scripter plugin to wire about 300 prototype links |
| `figma/README.md` | Screen codes D01–D24, C01–C30, M01–M14 and how to import |
| `figma/*.html` | Generated exports (git-ignored, shipped in the zip) |
| `docs/` | Write-ups, including this file |

## In Vercel, not in the repository

| Where | What | Used for |
|---|---|---|
| Project `dynamic_pricing_model_by_ai` → Settings → Environment Variables | `GEMINI_API_KEY` | AI companion, review, category check |
| | `KV_REST_API_URL`, `KV_REST_API_TOKEN` (+ `KV_URL`, `REDIS_URL`, read-only token) | Added by the Upstash Redis connection; the code reads the two `KV_REST_API_*` ones |
| | `ADMIN_KEY` (optional, you set it) | Shows full emails on the Master tab |
| Storage → Upstash Redis | `tf:works`, `tf:events`, `tf:posts` | Published works, use events, community posts |
| | `tf:db:master`, `tf:db:replica:human`, `tf:db:replica:agent`, `tf:db:log`, `tf:db:lsn` | Accounts database: master, two replicas, replication log, latest sequence number |
| Deployments | One per push to `main` | Redeploy from the "⋯" menu after changing settings |

## Generated or local only (never committed)

| Path | What |
|---|---|
| `dist/` | Built website (Vercel builds its own) |
| `node_modules/` | Installed packages |
| `.env` | Local keys, if any |
| `.data/twofold-db.json` | The accounts database when you run `npm run dev` |
