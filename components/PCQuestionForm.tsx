/**
 * =============================================================================
 * PC QUESTION FORM - User Questionnaire Component
 * =============================================================================
 *
 * This is the main form on the home page where users answer questions about
 * what kind of PC they want. It collects their budget and storage preferences.
 *
 * HOW IT WORKS:
 *   1. User selects budget range from dropdown
 *   2. User selects minimum storage from dropdown
 *   3. User clicks "Get recommendations"
 *   4. Form redirects to /results page with preferences in the URL
 *
 * COMPONENTS:
 *   - budgetOptions: The budget dropdown choices
 *   - storageOptions: The storage dropdown choices
 *   - toSearchParams(): Converts form data to URL parameters
 *   - PCQuestionForm: The actual React form component
 * =============================================================================
 */

"use client"; // This marks it as a client component (runs in browser, not server)

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { BudgetRange, StorageTier, UserPreferences } from "@/types/pc";

// Budget dropdown options - shown to user in the form
const budgetOptions: Array<{ value: BudgetRange; label: string }> = [
  { value: "under700", label: "Under $700" },
  { value: "700-999", label: "$700–$999" },
  { value: "1000-1499", label: "$1,000–$1,499" },
  { value: "1500plus", label: "$1,500+" },
];

// Storage dropdown options - shown to user in the form
const storageOptions: Array<{ value: StorageTier; label: string }> = [
  { value: "256-512", label: "256–512GB SSD" },
  { value: "1tb", label: "1TB SSD" },
  { value: "2tb", label: "2TB+ SSD" },
  { value: "any", label: "No preference" },
];

/**
 * -----------------------------------------------------------------------------
 * toSearchParams()
 * -----------------------------------------------------------------------------
 * Converts user preferences into URL search parameters.
 *
 * INPUTS:
 *   - prefs: The user's form selections
 *
 * OUTPUTS:
 *   - URLSearchParams object (for adding to the URL)
 *   - Example: "budget=700-999&storage=1tb"
 * -----------------------------------------------------------------------------
 */
function toSearchParams(prefs: UserPreferences): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("budget", prefs.budgetRange); // Add budget to URL
  sp.set("storage", prefs.minSsdStorageTier); // Add storage to URL
  return sp;
}

/**
 * -----------------------------------------------------------------------------
 * PCQuestionForm Component
 * -----------------------------------------------------------------------------
 * The questionnaire form displayed on the home page.
 *
 * STATE:
 *   - budgetRange: Currently selected budget option
 *   - minSsdStorageTier: Currently selected storage option
 *
 * BEHAVIOR:
 *   - When form is submitted, redirects to /results with selections in URL
 * -----------------------------------------------------------------------------
 */
export function PCQuestionForm() {
  const router = useRouter(); // Next.js hook for navigation

  // Form state - stores what the user has selected
  const [budgetRange, setBudgetRange] = useState<BudgetRange>("700-999"); // Default: $700-$999
  const [minSsdStorageTier, setMinSsdStorageTier] =
    useState<StorageTier>("1tb"); // Default: 1TB SSD

  // Combine form values into a single preferences object
  // useMemo prevents recreating this object on every render
  const prefs: UserPreferences = useMemo(
    () => ({ budgetRange, minSsdStorageTier }),
    [budgetRange, minSsdStorageTier]
  );

  return (
    <form
      className="w-full space-y-5"
      onSubmit={(e) => {
        e.preventDefault(); // Stop the default form submission
        // Navigate to results page with preferences in URL
        router.push(`/results?${toSearchParams(prefs).toString()}`);
      }}
    >
      {/* Grid layout for the two dropdowns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Budget dropdown */}
        <label className="space-y-1">
          <span className="text-sm font-medium">Budget</span>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={budgetRange}
            onChange={(e) => setBudgetRange(e.target.value as BudgetRange)}
          >
            {/* Loop through options and create <option> for each */}
            {budgetOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {/* Storage dropdown */}
        <label className="space-y-1">
          <span className="text-sm font-medium">Minimum SSD storage</span>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={minSsdStorageTier}
            onChange={(e) =>
              setMinSsdStorageTier(e.target.value as StorageTier)
            }
          >
            {storageOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-md bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Get recommendations
      </button>
    </form>
  );
}
