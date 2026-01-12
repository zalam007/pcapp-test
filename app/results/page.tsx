/**
 * =============================================================================
 * RESULTS PAGE - Shows PC Recommendations
 * =============================================================================
 *
 * This page displays the PC recommendations after the user submits the form.
 * It reads the user's preferences from the URL and passes them to ResultsClient.
 *
 * HOW IT WORKS:
 *   1. User submits form on home page
 *   2. Gets redirected to /results?budget=X&storage=Y
 *   3. This page reads those URL parameters
 *   4. Passes them to ResultsClient which fetches and displays recommendations
 *
 * URL PARAMETERS:
 *   - budget: "under700", "700-999", "1000-1499", or "1500plus"
 *   - storage: "256-512", "1tb", "2tb", or "any"
 *
 * HELPER FUNCTIONS:
 *   - coerceBudget(): Validates budget parameter (defaults to "700-999")
 *   - coerceStorage(): Validates storage parameter (defaults to "1tb")
 * =============================================================================
 */

import Link from "next/link";

import { ResultsClient } from "@/components/ResultsClient";
import type { BudgetRange, StorageTier, UserPreferences } from "@/types/pc";

/**
 * -----------------------------------------------------------------------------
 * coerceBudget()
 * -----------------------------------------------------------------------------
 * Validates the budget URL parameter. If it's not a valid option, returns
 * the default value "700-999".
 *
 * INPUTS:
 *   - v: The budget value from the URL (might be undefined or invalid)
 *
 * OUTPUTS:
 *   - A valid BudgetRange value
 * -----------------------------------------------------------------------------
 */
function coerceBudget(v: string | undefined): BudgetRange {
  // Check if it's one of the valid options
  if (
    v === "under700" ||
    v === "700-999" ||
    v === "1000-1499" ||
    v === "1500plus"
  )
    return v;
  return "700-999"; // Default if invalid or missing
}

/**
 * -----------------------------------------------------------------------------
 * coerceStorage()
 * -----------------------------------------------------------------------------
 * Validates the storage URL parameter. If it's not a valid option, returns
 * the default value "1tb".
 *
 * INPUTS:
 *   - v: The storage value from the URL (might be undefined or invalid)
 *
 * OUTPUTS:
 *   - A valid StorageTier value
 * -----------------------------------------------------------------------------
 */
function coerceStorage(v: string | undefined): StorageTier {
  // Check if it's one of the valid options
  if (v === "256-512" || v === "1tb" || v === "2tb" || v === "any") return v;
  return "1tb"; // Default if invalid or missing
}

/**
 * -----------------------------------------------------------------------------
 * ResultsPage Component (Default Export)
 * -----------------------------------------------------------------------------
 * The results page component. Next.js renders this for the "/results" route.
 * This is an async component because it needs to read searchParams.
 *
 * INPUTS:
 *   - searchParams: URL parameters from Next.js (Promise)
 *
 * OUTPUTS:
 *   - The rendered results page HTML
 * -----------------------------------------------------------------------------
 */
export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Read the URL parameters
  const sp = await searchParams;

  // Build the preferences object from URL parameters
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
        {/* Header row with title and "Edit answers" button */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your recommendations
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Strict filters (Option A): missing specs are excluded.
            </p>
          </div>
          {/* Link back to home page to change answers */}
          <Link
            href="/"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Edit answers
          </Link>
        </div>

        {/* Results section - renders the ResultsClient component */}
        <div className="mt-8">
          <ResultsClient prefs={prefs} />
        </div>
      </main>
    </div>
  );
}
