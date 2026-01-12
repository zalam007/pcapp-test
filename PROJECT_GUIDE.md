# PC Recommender - Project Guide

## What This App Does

This is a web application that recommends prebuilt gaming PCs from Amazon based on your budget and storage preferences. It asks you 2 simple questions, then searches Amazon using the Canopy API and shows you the best matches ranked by performance.

---

## Tech Stack

### Frontend & Backend

- **Next.js 16.1.1** - React framework that handles both frontend UI and backend API routes
- **React 19** - JavaScript library for building the user interface
- **TypeScript** - Adds type safety to JavaScript (catches errors before runtime)
- **Tailwind CSS** - Utility-first CSS framework for styling

### External APIs

- **Canopy API** - Third-party service that provides Amazon product search
  - Base URL: `https://rest.canopyapi.co`
  - Endpoint used: `/api/amazon/search`

### Development Tools

- **Turbopack** - Fast bundler (development mode)
- **ESLint** - Code linting
- **Node.js** - JavaScript runtime

---

## Getting Started

📖 **New to the project?** See [INSTALLATION.md](INSTALLATION.md) for setup instructions.

---

## Project Structure

```
test/
├── app/                          # Next.js App Router pages
│   ├── api/                     # Backend API routes
│   │   └── recommend/
│   │       └── route.ts        # API endpoint that calls Canopy
│   ├── results/
│   │   └── page.tsx            # Results page (shows recommendations)
│   ├── favicon.ico             # Site favicon
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout (wraps all pages)
│   └── page.tsx                # Home page (questionnaire form)
│
├── components/                   # Reusable React components
│   ├── PCCard.tsx              # Card displaying one PC recommendation
│   ├── PCQuestionForm.tsx      # Form with budget & storage questions
│   └── ResultsClient.tsx       # Client component that fetches recommendations
│
├── docs/                        # Project documentation
│   ├── INSTALLATION.md         # Setup instructions
│   ├── MVP_PLAN.md             # Original MVP planning document
│   ├── PROJECT_GUIDE.md        # This file - main documentation
│   └── README.md               # Project overview
│
├── lib/                         # Business logic & utilities
│   ├── canopyClient.ts         # Wrapper for Canopy API calls
│   └── rank.ts                 # Filtering & scoring logic for PCs
│
├── public/                      # Static assets (images, etc.)
│
├── types/                       # TypeScript type definitions
│   └── pc.ts                   # Types for user preferences & PC data
│
├── .env.local                  # Environment variables (API keys)
├── .gitignore                  # Git ignore rules
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js configuration
├── next-env.d.ts               # Next.js TypeScript declarations
├── package.json                # Project dependencies & scripts
├── package-lock.json           # Locked dependency versions
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## How It Works - Data Flow

### 1. User Fills Out Form

**File:** `app/page.tsx` → renders `components/PCQuestionForm.tsx`

- User selects **Budget** (e.g., "$700-$999")
- User selects **Storage** (e.g., "1TB")
- User clicks "Get recommendations"
- Form redirects to `/results?budget=700-999&storage=1tb`

### 2. Results Page Loads

**File:** `app/results/page.tsx`

- Reads URL parameters (`budget` and `storage`)
- Converts them to a `UserPreferences` object
- Passes preferences to `ResultsClient` component

### 3. Client Fetches Recommendations

**File:** `components/ResultsClient.tsx`

- Makes a POST request to `/api/recommend` with user preferences
- Displays loading state while waiting
- Shows results when data arrives

### 4. API Route Processes Request

**File:** `app/api/recommend/route.ts`

This is the backend logic that runs on the server:

```
User Preferences
      ↓
Convert budget to price range (e.g., $700-$999)
      ↓
Call Canopy API to search Amazon
   - Search term: "gaming desktop computer"
   - Filter by price range
   - Get 50 results
      ↓
Parse each result's title to extract specs
   - CPU (e.g., "Ryzen 7 5800X", "i7-12700")
   - GPU (e.g., "RTX 4070", "RX 7800 XT")
   - RAM (e.g., "16GB", "32GB")
      ↓
Rank & filter with rank.ts
   - Remove listings missing critical info
   - Filter by storage requirement
   - Score based on CPU + GPU + RAM performance
   - Sort by score (best first)
   - Return top 5
      ↓
Send recommendations to frontend
```

### 5. Display Results

**File:** `components/PCCard.tsx`

- Each recommendation is displayed as a card
- Shows: title, price, specs, Amazon link
- User can click to buy on Amazon

---

## Key Files Explained

### `types/pc.ts`

**What it does:** Defines TypeScript types for the entire app

```typescript
// What budget range the user selected
type BudgetRange = "under700" | "700-999" | "1000-1499" | "1500plus";

// What minimum storage they want
type StorageTier = "256-512" | "1tb" | "2tb" | "any";

// User's answers to the questionnaire
interface UserPreferences {
  budgetRange: BudgetRange;
  minSsdStorageTier: StorageTier;
}

// A PC listing from Amazon
interface PcListing {
  title: string;
  url: string;
  priceUsd: number;
  cpu?: string; // e.g., "Ryzen 7 5800X"
  gpu?: string; // e.g., "RTX 4070"
  ramGb?: number; // e.g., 16
  storageGb?: number; // e.g., 1000
  // ... other fields
}

// A recommended PC with a performance score
interface PcRecommendation {
  listing: PcListing;
  score: number; // 0-100, higher is better
  reason: string; // Why it's recommended
}
```

### `lib/canopyClient.ts`

**What it does:** Handles communication with the Canopy API

- `CanopyClient` class wraps API calls
- `searchAmazon()` method searches for products
- `getCanopyClientFromEnv()` reads API credentials from `.env.local`

**Example usage:**

```typescript
const client = getCanopyClientFromEnv();
const results = await client.searchAmazon({
  searchTerm: "gaming desktop computer",
  minPrice: 700,
  maxPrice: 999,
  limit: 50,
});
// Returns array of products with title, price, URL, etc.
```

### `lib/rank.ts`

**What it does:** Filters and scores PC listings

**Main functions:**

1. **`strictMeetsRequirements(listing)`** - Checks if a listing has all required data

   - Must have: price, URL, CPU, RAM
   - Returns: `{ ok: true }` or `{ ok: false, reason: "..." }`

2. **`recommendFromCandidates(candidates, prefs)`** - Main ranking logic

   - Filters by budget (with 12% tolerance)
   - Filters by storage requirement
   - Scores based on:
     - **CPU tier** (40% weight): i3/Ryzen3=20, i5/Ryzen5=40, i7/Ryzen7=70, i9/Ryzen9=100
     - **GPU tier** (40% weight): GTX1650=20, RTX3060=40, RTX4070=70, RTX4090=100
     - **RAM** (20% weight): 8GB=30, 16GB=60, 32GB=90, 64GB=100
   - Sorts by score (descending)
   - Returns top 5

3. **Helper functions for parsing:**
   - `inferCpuTier(cpu)` - Scores CPU based on model
   - `inferGpuTier(gpu)` - Scores GPU based on model
   - `inferRamScore(ramGb)` - Scores RAM based on size

### `app/api/recommend/route.ts`

**What it does:** Backend API route that Next.js serves

- Receives POST request with `UserPreferences`
- Calls Canopy API to search Amazon
- Parses titles to extract CPU/GPU/RAM specs
- Uses `rank.ts` to filter & score
- Returns JSON response with recommendations

**Title parsing example:**

```
Title: "Skytech Gaming PC AMD Ryzen 7 5800X RTX 4070 16GB DDR4 1TB NVMe SSD"
       ↓
Extracted:
  cpu: "Ryzen 7 5800X"
  gpu: "RTX 4070"
  ramGb: 16
  storageGb: 1000
```

### `components/PCQuestionForm.tsx`

**What it does:** Interactive form component

- Two dropdown menus (Budget, Storage)
- Uses React `useState` hooks to track selections
- On submit: navigates to `/results` with URL parameters
- Client-side component (`"use client"`)

### `components/ResultsClient.tsx`

**What it does:** Fetches and displays recommendations

- Uses `useEffect` to fetch data when component loads
- Shows loading spinner while fetching
- Displays error if API call fails
- Shows warning if mock data is used (Canopy not configured)
- Maps each recommendation to a `PCCard` component

### `components/PCCard.tsx`

**What it does:** Displays one PC recommendation

- Shows product image
- Shows title, price, specs
- Shows performance score as a progress bar
- Shows recommendation reason
- "View on Amazon" button links to product

---

## How to Make Changes

### Change the Questions

1. **Add/remove questions:** Edit `components/PCQuestionForm.tsx`
2. **Add new preference type:** Update `types/pc.ts` → add to `UserPreferences`
3. **Update filtering:** Edit `lib/rank.ts` → add filter in `recommendFromCandidates()`

### Change Styling

1. **Global styles:** Edit `app/layout.tsx` (fonts, colors)
2. **Component styles:** Edit Tailwind classes directly in component files
3. **Tailwind config:** Edit `tailwind.config.ts` for custom colors/spacing

### Change Ranking Algorithm

1. **Edit weights:** Go to `lib/rank.ts` → change `weights` object

   ```typescript
   const weights = { cpu: 0.4, gpu: 0.4, ram: 0.2 };
   // Example: make GPU more important
   const weights = { cpu: 0.3, gpu: 0.5, ram: 0.2 };
   ```

2. **Change CPU/GPU tiers:** Edit `inferCpuTier()` or `inferGpuTier()` functions

3. **Change budget tolerance:** Edit `recommendFromCandidates()`
   ```typescript
   const tolerancePct = 0.12; // 12% tolerance
   ```

### Change Search Term

1. **Edit:** `app/api/recommend/route.ts`
   ```typescript
   searchTerm: "gaming desktop computer",
   // Change to:
   searchTerm: "gaming pc prebuilt",
   ```

### Add New API Endpoint

1. Create folder in `app/api/` (e.g., `app/api/myendpoint/`)
2. Create `route.ts` file
3. Export `GET()` or `POST()` function
4. Example:
   ```typescript
   export async function GET(request: Request) {
     return Response.json({ message: "Hello!" });
   }
   ```

---

## Common Issues & Solutions

### "Using mock data" warning appears

**Problem:** Canopy API key not configured properly
**Solution:**

1. Check `.env.local` exists with `CANOPY_API_KEY` and `CANOPY_BASE_URL`
2. Restart dev server: `Ctrl+C` then `npm run dev`

### No results showing

**Problem:** API call failed or no products match criteria
**Solution:**

1. Open browser DevTools (F12) → Console tab
2. Look for error messages
3. Check Network tab for failed requests

### TypeScript errors

**Problem:** Type mismatch
**Solution:**

1. Check `types/pc.ts` for correct type definitions
2. Make sure interfaces match between files
3. Run `npm run build` to see all TypeScript errors

_For more troubleshooting, see [INSTALLATION.md](INSTALLATION.md)_

---

## Understanding the Code

### What is "Client Component" vs "Server Component"?

In Next.js 13+, components are **Server Components** by default (run on server, send HTML to browser).

**Server Components:**

- `app/page.tsx` - Runs on server
- Can access database, file system, environment variables
- Cannot use browser APIs, useState, useEffect

**Client Components:**

- Have `"use client"` at the top
- `components/PCQuestionForm.tsx` - Runs in browser
- Can use useState, useEffect, onClick handlers
- Cannot access server-only APIs

### What is an API Route?

Files in `app/api/` become backend endpoints:

- `app/api/recommend/route.ts` → accessible at `/api/recommend`
- Runs on the server (Node.js)
- Can access environment variables, make external API calls
- Returns JSON responses

### What are URL Search Parameters?

The `?budget=700-999&storage=1tb` part of the URL:

- Next.js automatically parses these
- Accessible via `searchParams` in page components
- Used to pass data between pages without forms

---

## Next Steps / Future Enhancements

Possible features to add:

1. **More filters:** Add RAM, GPU, or brand preferences
2. **Comparison mode:** Compare 2-3 PCs side-by-side
3. **Save favorites:** Let users bookmark PCs
4. **Price alerts:** Notify when price drops
5. **Better parsing:** Use Canopy product detail endpoint for more accurate specs
6. **User reviews:** Show Amazon ratings/reviews
7. **Build guides:** Link to PC building tutorials

---

## Resources for Learning

- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook/
- **Tailwind CSS Docs:** https://tailwindcss.com/docs

---
