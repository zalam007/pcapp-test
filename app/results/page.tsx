import Link from "next/link";

import { ResultsClient } from "@/components/ResultsClient";
import type { BudgetRange, StorageTier, UserPreferences } from "@/types/pc";

function coerceBudget(v: string | undefined): BudgetRange {
  if (
    v === "under700" ||
    v === "700-999" ||
    v === "1000-1499" ||
    v === "1500plus"
  )
    return v;
  return "700-999";
}

function coerceStorage(v: string | undefined): StorageTier {
  if (v === "256-512" || v === "1tb" || v === "2tb" || v === "any") return v;
  return "1tb";
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const prefs: UserPreferences = {
    budgetRange: coerceBudget(
      typeof sp.budget === "string" ? sp.budget : undefined
    ),
    minSsdStorageTier: coerceStorage(
      typeof sp.storage === "string" ? sp.storage : undefined
    ),
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your recommendations
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Strict filters (Option A): missing specs are excluded.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Edit answers
          </Link>
        </div>

        <div className="mt-8">
          <ResultsClient prefs={prefs} />
        </div>
      </main>
    </div>
  );
}
