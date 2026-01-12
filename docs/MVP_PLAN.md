# PC Recommender MVP (Canopy-powered) — Planning Doc

## Goal

Ship a small web app that asks a few questions (budget, primary use, storage) and recommends **real prebuilts** with **live-ish product data** pulled via **Canopy** (instead of a manually curated JSON list).

## Non-goals (for MVP)

- No AI chat.
- No PC-part compatibility/build-your-own.
- No user accounts.
- No price tracking/history.

## User experience (MVP)

### Screen 1: Questionnaire

Inputs (minimal but useful):

- Budget (PC only): Under $700 | $700–$999 | $1,000–$1,499 | $1,500+
- Minimum SSD storage: 256–512GB | 1TB | 2TB+ | No preference
- Color: Black | White | Silver/Gray | Any
- Performance goal: Everyday | Balanced | Gaming-first | Creator

Action:

- User clicks “Get recommendations”

### Screen 2: Results

Display top single match:

- Product title
- Current price
- CPU / GPU / RAM / Storage (as available)
- Short “Why this fits” bullets (rule-based)
- Link/button: “View on Amazon”

### Strictness policy (Option A)

For MVP we use **Strict** parsing/filters:

- Always require: `price` and `amazonUrl`.
- Always require: `cpu` and `ramGb` (or the listing is excluded).
- For **Gaming-first**: also require a **discrete GPU** identified in the listing (`RTX`, `GTX`, `RX ####`, `Arc A###`).
- For **Creator**: discrete GPU is strongly preferred; if GPU is missing/ambiguous, we may exclude it (recommended) or down-rank it (optional later).

Rationale: fewer results, but higher trust and simpler implementation.

## Data strategy (with Canopy)

We will source products dynamically from Amazon using Canopy.

### Assumptions (to confirm)

Canopy provides one or more of:

- Search endpoint (query + filters)
- Product detail endpoint (given URL/ASIN)
- Structured extraction for price/spec fields OR raw HTML/text we can parse

If Canopy only returns raw text/HTML:

- We’ll parse key specs using conservative regex + fallbacks.
- We’ll accept that some listings won’t yield full structured specs.

## Architecture

### Recommended stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind
- Backend: Next.js Route Handlers (server-side) that call Canopy
- No database for MVP

### Why have a backend route at all?

To avoid exposing the Canopy API key to the browser.

## Secrets / API keys (important)

Do **not** paste API keys into chat or commit them.

Local dev should use:

- `.env.local` (not committed)
- Environment variable name (proposal): `CANOPY_API_KEY`

Example (local only):

```
CANOPY_API_KEY=YOUR_KEY_HERE
```

We’ll also add `.env.local` to `.gitignore` when we move into implementation.

## Modules / folders (when we implement)

- `app/page.tsx` — questionnaire
- `app/results/page.tsx` — results
- `app/api/recommend/route.ts` — server route that calls Canopy + ranks results
- `lib/canopyClient.ts` — Canopy HTTP client wrapper
- `lib/parseSpecs.ts` — parse CPU/GPU/RAM/Storage from listing text
- `lib/rank.ts` — scoring logic
- `types/pc.ts` — shared types

## Recommendation algorithm (MVP)

### Inputs

UserPreferences:

- budgetRange
- minSsdStorageTier
- color
- performanceGoal

### Steps

1. Query Canopy for Amazon results (keyword + category terms) based on `performanceGoal`.
2. For each candidate listing:
   - Extract price
   - Extract/parse specs (CPU/GPU/RAM/Storage)

- Drop items missing required fields per **Strictness policy (Option A)**

3. Filter by:
   - price in budget range (allow ±10–15% tolerance)

- storage tier meets `minSsdStorageTier` (if storage detected)
- color matches (if user didn’t choose Any)

4. Score and sort.

### Scoring (simple + explainable)

- Budget fit: 0–40
- Use-case fit (GPU/CPU/RAM heuristics): 0–40
- Storage fit: 0–10
- Value heuristic (specs vs price tier): 0–10

We will generate “Why this fits” bullets from the same scoring rules.

### Performance goal → ranking weights

We compute rough subscores from parsed listing text:

- `cpuScore` (0–5): Intel i9 > i7 > i5 > i3; Ryzen 9 > 7 > 5 > 3; newer generations slightly higher.
- `gpuScore` (0–5): RTX/RX/Arc tier inferred by model number (e.g., 4070 > 4060 > 3060; 7800XT > 7600 > 6600).
- `ramScore` (0–3): 8GB=1, 16GB=2, 32GB+=3.

Then weight them depending on `performanceGoal`:

- **Everyday**: CPU + RAM matter most; GPU low weight.
- **Balanced**: CPU + RAM primary; GPU moderate.
- **Gaming-first**: GPU dominant; CPU secondary; RAM minimum 16GB.
- **Creator**: CPU dominant; GPU secondary; RAM prefers 32GB.

## Use-case heuristics (examples)

- Gaming:
  - Prefer dedicated GPU listings (RTX/RADEON keywords)
  - 16GB+ RAM recommended
- Work/School:
  - Integrated graphics ok
  - Emphasize CPU + RAM
- Content creation:
  - Prefer 32GB RAM, stronger CPU, and dedicated GPU for video editing

## Canopy integration details (to fill in)

To proceed, we need from you:

1. Canopy base URL + docs link (or a sample request)
2. Auth method (header name / bearer token format)
3. Example response for:
   - Amazon search
   - product details

Once we have those, we’ll lock down:

- `canopyClient` request shapes
- rate limiting / retries
- minimal caching strategy

## Milestones

1. Confirm Canopy endpoints + auth format
2. Define search queries per use-case
3. Implement recommend API route (server only)
4. Implement UI form + results UI
5. Add basic validation + error states
6. MVP polish (loading states, empty-state messaging)

## Open questions

- What exactly does “Canopy” refer to (product scraping, affiliate API, etc.)? Please share the docs or sample curl.
- Do you want results restricted to specific brands (CyberPowerPC, Skytech, iBUYPOWER, etc.)?
- Should we include refurbished/used listings or only new?
