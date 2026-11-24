# Twofold — an AI Creator Studio prototype

**Twofold** is a studio for creators whose audience is half people, half machines. A creator writes a piece, sees an honest estimate of what it's worth, sets separate prices and permissions for readers and for AI systems, publishes it with a tamper-proof seal, and then sees who (and what) used it and what it earned.

Built for the Zzazz campus placement assignment, "AI Creator Studio for the AI Era". Every person, company, outlet, AI system and piece of content in it is made up.

- **Live prototype:** `https://<your-vercel-url>` (works on desktop and phone)
- **System design:** [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md)
- **Product note** (the brief's questions, edge cases, creator FAQ): [`docs/PRODUCT_NOTE.md`](docs/PRODUCT_NOTE.md)

---

## The five screens

| Screen | Route | What it shows |
|---|---|---|
| Reader home | `#/` | A simple front page. New pieces appear here live when the creator publishes |
| **1. Write & value** | `#/studio/write` | Editor + live value panel: 30-day earnings range, confidence, four signals, gaming flags, what would raise the value (in ₹), optional AI second opinion |
| **2. Licence builder** | `#/studio/licence` | Four uses (read, AI quote, AI training, republish), each Free / Paid / Ask me / Not allowed; presets; plain-English terms beside the machine-readable JSON; publish and seal |
| **3. Public work page** | `#/work/<id>` | Preview, price, terms, author, date, human/AI disclosure, seal check, "check a copy", report button. Toggle **A person / An AI system**; the AI view runs real MCP calls |
| **4. Earnings** | `#/studio/earnings` | People vs AI, by use, per day, per buyer, live activity, derivatives tree with royalties, fake-content reports with escrow, price now vs launch price |

### Two-minute demo script

1. **Write & value.** The draft is Riya's new exclusive. Note the range, confidence and the four signals. Click **Padded SEO piece**: the estimate collapses to about ₹14–24 and explains why (keyword stuffing, repetition, boilerplate, 100% overlap with commodity text). Click **Your draft** again, toggle **Source document**, and watch the value rise.
2. **Licence.** Pick **Keep me out of AI training**. The plain-English paragraph and the JSON change together. Note the timer: it takes well under a minute.
3. **Publish and seal**, then **See it on the home feed**. Open the home page in a second tab first, and you'll see the card arrive live.
4. **Public page.** Check the green seal. In *Check a copy*, click **Try an altered copy**, then **Check against the seal**: the changed figure is highlighted.
5. Switch to **An AI system** and click **Run the calls**. FinPilot (a trading agent) searches, previews free, gets `402 access_required` with offers, buys a quote licence and retrieves the text with attribution rules.
6. **Earnings.** FinPilot's purchase is at the top of *Latest activity*. Accept or decline Halcyon Labs' training request, see derivatives paying back, and see the report under review with only that piece's earnings partly held.

---

## How the value estimate works

The estimate answers one question: *what is this piece likely to earn in its first 30 days, and why?* It is deterministic (same text, same number), recomputed on every keystroke, and shown as a **range with a confidence level**. Code: `src/engine/valuation.ts`.

### Signals (0–100)

| Signal | Rewards | Computed from |
|---|---|---|
| **Originality (O)** | New, specific, first-hand information | specifics per 100 words (numbers, named entities, quotes ×1.5), first-hand markers ("memo seen by", "I tested", "our dataset"), lexical diversity (moving-window type/token ratio); minus boilerplate phrases (−0.08 each, max −0.5) and 5-word-shingle similarity to commodity text (×0.8) |
| **Depth (D)** | Substance and evidence | *effective words* (log scale, saturating near 1,200), evidence (attributions + quotes + attached source documents/raw data), structure (paragraphs); multiplied by (1 − padding penalty) |
| **Timeliness (T)** | Being early on something that matters now | time markers in the text; kind of work; each kind has a half-life: news 36 h, video/review 30 days, dataset 1 year |
| **Demand (Dm)** | Topics people and agents are asking about now | simulated demand index per topic (`src/engine/demand.ts`); top topic + 0.15 × second + 0.05 × third; +0.08 if a listed company is named (finance agents query them constantly) |

```
effectiveWords = words × uniqueSentenceRatio × (1 − trigramRepetition)
Quality   Q = 0.55·O + 0.45·D
Market    M = 0.65·Dm + 0.35·T
Value     V = Q^0.6 × M^0.4        geometric, so a hot topic can't rescue thin content
```

### From value to money (₹, first 30 days)

```
read price    p_read  = (3 + 16·(V/100)^1.3 × kindFactor) × verified     V < 25 → suggest free
quote price   p_quote = p_read × quoteRatio × freshness               quoteRatio: article 0.12, video 0.08, dataset 0.012
republish     p_repub = max(₹150, p_read × 60)
training      p_train = max(₹500, k × 12-month quote income × (1 − 0.7·perishability) × verified)
                                                                        k: 2 (article, video), 5 (dataset)

paid reads    = followers × (0.5 + 2.5·M/100) × (0.04 + 0.16·Q/100) × convFactor
AI answers    = agent queries/month on the top 2 topics × citation share(Q, O)
training      = P(sale) × p_train         P: 0.02 + 0.15·O/100 (articles), 0.08 + 0.3·O/100 (datasets)
derivatives   = 10% of reader income × O/100

estimate E = reads·p_read + answers·p_quote + training + derivatives
range      = E × (1 ± u),   u = 0.6 − 0.45·confidence
verified   = 1.1 when a source document or raw data is attached (checked claims carry less dispute risk)
```

### Confidence

```
confidence = 0.35·min(1, words/400) + 0.25·min(1, pastPieces/20)
           + 0.25·(topic in demand index ? 1 : 0.4) + 0.15·creator reputation − 0.1·(serious quality flag)
Low < 0.45 ≤ Medium < 0.70 ≤ High
```

The panel always says *why* (e.g. "Only 9 past pieces to compare with").

### Gaming resistance

| Trick | What happens |
|---|---|
| Stuffing trending keywords | Each topic is credited once. More than 2.5 trending terms per 100 words, or 4+ trending topics with few facts → flag, demand × 0.5, originality −15, AI answers × 0.3 |
| Padding length | Depth counts *effective* words: repeated sentences and repeated phrasing are removed first |
| Generic / machine-sounding prose | Boilerplate-phrase penalty on originality |
| Rewriting already-published text | 5-word shingle overlap with a commodity corpus |
| Clickbait headline | Headline words missing from the body → flag |
| Prompt injection against the AI review | The piece is passed as untrusted data, the response is schema-constrained JSON, and the LLM can only move each score ±10. Scores are recomputed server-side, never taken from the client |

### Honest when the news is bad
Below V = 30 the panel leads with the low number and the main reason. Each suggestion shows its ₹ uplift, computed by re-running the model with that one change (e.g. *Attach the document you quote: +₹2,466*). If nothing would help much, it says so.

### Sample outputs (current constants)

| Sample | Signals O / D / T / Dm | 30-day range | Confidence |
|---|---|---|---|
| Riya's exclusive (Meridian Bank) | 83 / 73 / 94 / 84 | ₹19,500 – ₹30,600 | High |
| Voltaris scoop (published seed) | 100 / 75 / 94 / 100 | ₹32,700 – ₹49,200 | High |
| Groundwater dataset | 100 / 74 / 40 / 75 | ₹29,800 – ₹51,600 (mostly training) | High |
| Phone battery video | 100 / 50 / 55 / 78 | ₹21,200 – ₹35,100 | High |
| Padded SEO piece | 0 / 25 / 50 / 53 | ₹14 – ₹24 | High |

Run `npx tsx scripts/calibrate.ts` to reproduce.

### After publishing
Before publishing, the price comes from the **content**. After, it follows **engagement**: market read price = launch price × √(actual ÷ expected daily reads), bounded 0.5×–1.5×. The *Your pieces* table shows both. This is where a production system would hand over to a live pricing model trained on engagement signals.

---

## Why the four uses are priced differently

| Use | Default | Reasoning |
|---|---|---|
| Person reads | Paid, ₹10–25 for strong news, 80-word free preview, included in Pass | Direct value to one person |
| AI quotes / summarises | ~12% of a read, per answer; must name the creator, link back, quote ≤ 40 words | An answer meets only part of a reader's need, but it happens far more often and carries attribution |
| AI trains a model | **Ask me**; indicative one-time price per model | Irreversible, unattributed, and it substitutes the creator in future answers |
| Republish / remix | ~60 reads' worth; derivatives pay 30% back | A republisher brings the work to a new audience |

**Training vs quoting:** per event, training costs far more and is opt-in. Over a news piece's life, quotes often earn more because news value decays fast. For a rare dataset, training is where the value is, so its suggested training price is ~5× higher.

---

## Licences

`src/engine/licence.ts` holds one licence object per work. Two views are generated from it: a plain-English paragraph (`summarise`) and machine-readable JSON (`toMachineJson`). Neither is written by an LLM, so they can never disagree. The JSON is inspired by RSL usage tokens but uses our own schema (`/licence/v1`). It is served at `/api/licence/<id>`, linked from every page (`<link rel="license">`) and from `robots.txt`, and returned by the MCP server.

## Provenance

On publish the text is normalised (Unicode NFC, whitespace) and fingerprinted (SHA-256). The fingerprint, author, time and AI disclosure are signed with the creator's key (ECDSA P-256, WebCrypto). The public page re-checks both in the browser and says it in plain language. *Check a copy* highlights exactly what a pasted copy changed. Seed works are sealed by `scripts/seal-seeds.ts` with demo keys; in production keys stay on the creator's device or in an HSM.

## Simulated month of usage

`src/data/seed.ts` generates 26 Oct – 24 Nov 2026 from a seeded random generator, so numbers are stable:

- 4 of Riya's pieces, plus 3 pieces by other creators for the reader home page.
- Per piece per day: pay-per-read readers, Pass readers (₹4.20 payout per read from a ₹199/month pool), and AI answers from four AI systems: FinPilot (trading agent), Kestrel Search, Lumen Assistant, Morning Digest bot.
- Volume = base × half-life decay (+7% long tail) × weekday factor (weekends 0.62) × noise (±20%), with one viral day.
- One-off licences: two training licences (Halcyon Labs), one analyst team licence, three republish licences.
- Derivatives: Marathi translation (30% back), 60-second clip (20%), a Hindi voice-over of the clip (20% to the clip), a newsletter summary (15%), and one unlicensed copy found by fingerprint.
- Reports: one under review (weight 1.1, 27.5% of that piece's new earnings held) and one dismissed (weight 0.4, below threshold, nothing held).
- One pending training request.

Amounts on the dashboard are the creator's 85% share.

---

## The AI parts

| Where | What | Fallback |
|---|---|---|
| `/api/review` | Gemini reads the draft with the rule-based scores and flags, returns schema-constrained JSON (summary, strengths, risks, suggestions, ±10 nudges per signal). The server clamps the nudges and recomputes rule scores itself | If there's no key, a timeout or a rate limit, it returns the rule-based review and says why |
| Value estimate | Deterministic rules on every keystroke (no LLM: it must be instant, reproducible and hard to game) | — |
| Licence summary | Deterministic, from the licence object | — |

Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default `gemini-flash-latest`) on the host.

## MCP server (for AI agents)

`POST /api/mcp`, JSON-RPC 2.0, Streamable-HTTP compatible (JSON responses). Tools: `search_works`, `get_work_metadata`, `get_work_preview`, `get_full_work`, `purchase_licence`, `report_work`. Demo credentials: `Authorization: Bearer demo-finpilot` (also `demo-lumen`, `demo-kestrel`, `demo-halcyon`).

```bash
H=https://<your-vercel-url>
curl -s $H/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_full_work","arguments":{"work_id":"tf_vlt_0001","use":"ai_quote"}}}'
# → access_required (402) with offers
curl -s $H/api/mcp -H 'content-type: application/json' -H 'authorization: Bearer demo-finpilot' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"purchase_licence","arguments":{"work_id":"tf_vlt_0001","use":"ai_quote"}}}'
# → licence_token + usage record (appears on the dashboard)
```

Any MCP client that supports remote servers can connect to `$H/api/mcp`.

---

## Run it

```bash
npm install
npm run dev          # API on :8787 + Vite on :5173
npm run build        # bundles the shared engine for /api, type-checks, builds dist/
```

Deploy: import the repo into Vercel (framework: Vite). Optional env: `GEMINI_API_KEY`, `GEMINI_MODEL`. For cross-device persistence add Upstash Redis (Vercel Marketplace); without it the API keeps live data in memory per instance, and each browser also keeps its own copy, so the demo always works.

### Project layout

```
src/engine/   valuation.ts  licence.ts  seal.ts  mcp.ts  demand.ts   ← pure logic, shared by browser and API
src/data/     samples.ts  seed.ts  works.ts  seedSeals.ts               ← made-up content and the simulated month
src/screens/  Home  Write  Licence  WorkPage  Earnings
api/          mcp.js  review.js  feed.js  works.js  licence.js  robots.js  (+ _lib/core.mjs built from src/)
docs/         SYSTEM_DESIGN.md  PRODUCT_NOTE.md
scripts/      calibrate.ts  seal-seeds.ts  build-api.mjs  shot.py  e2e.py  capture_figma.py
```

---

## Assumptions

- Currency is INR; creator keeps 85%, platform 15%, always.
- Demand index, agent query volumes and follower counts are simulated, chosen to be plausible for an independent Indian creator in 2026.
- An AI answer is worth ~12% of a read for news (less for datasets, where an answer exposes only a figure).
- Pass readers are paid ₹4.20 per read from the subscription pool.
- Payments, identity, verification reviewers and fact-checkers are simulated. No real money moves.
- Training permission cannot be technically enforced after delivery; Twofold relies on licence terms, attribution checks and fingerprint monitoring, and says so in the product.

## AI tools used

| Tool | Used for |
|---|---|
| Claude (Anthropic) | Research on the company and on content licensing; critiquing the initial approach; system design; writing the code, the valuation constants and mock content; screenshot-based UI review; drafting the README and product note |
| Gemini API (Google) | Runtime "AI second opinion" in the Write & value screen |
| Figma | Design review and refinement of the screens (imported from the coded prototype) |
| *(add any others you used)* | |

## Open-source credits

React (MIT), Vite (MIT), Tailwind CSS (MIT), TypeScript (Apache-2.0), esbuild (MIT), tsx (MIT), Express (MIT, local dev only), Playwright (Apache-2.0, screenshots and tests). Fonts via Fontsource: Newsreader (OFL), Schibsted Grotesk (OFL), JetBrains Mono (OFL).
