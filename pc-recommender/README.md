# PC Recommender (MVP)

Form-based prebuilt PC recommendations using strict spec filters (Option A).

The app asks 4 questions (budget, storage, color, performance goal) and ranks results using simple CPU/GPU/RAM heuristics.

By default it runs using **mock data** until Canopy is configured.

## Getting Started

Install and run the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Canopy configuration (optional)

Create a `.env.local` file (it is gitignored) and set:

- `CANOPY_API_KEY`
- `CANOPY_BASE_URL` (set to `https://rest.canopyapi.co`)
- `CANOPY_AUTH_HEADER_NAME` (set to `API-KEY`)

If Canopy isn't configured, the app will fall back to mock candidates.

Key pages:

- `app/page.tsx` (questionnaire)
- `app/results/page.tsx` (results)
- `app/api/recommend/route.ts` (server route)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
