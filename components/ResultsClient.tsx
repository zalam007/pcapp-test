/**
 * =============================================================================
 * RESULTS CLIENT - Displays PC Recommendations
 * =============================================================================
 *
 * This component fetches recommendations from the API and displays them.
 * It's the main content on the /results page after users submit the form.
 *
 * HOW IT WORKS:
 *   1. Receives user preferences from the URL (passed as props)
 *   2. Calls the /api/recommend endpoint with those preferences
 *   3. Displays loading state while waiting
 *   4. Shows PC cards when results arrive, or error if something went wrong
 *
 * STATE VARIABLES:
 *   - loading: Are we waiting for the API response?
 *   - error: Did something go wrong? (stores error message)
 *   - recommendations: The PC recommendations from the API
 *   - usedMockData: Did we use fake test data instead of real API data?
 * =============================================================================
 */

"use client"; // Runs in browser, not server

import { useEffect, useMemo, useState } from "react";

import { PCCard } from "@/components/PCCard";
import type { PcRecommendation, UserPreferences } from "@/types/pc";

/**
 * -----------------------------------------------------------------------------
 * ResultsClient Component
 * -----------------------------------------------------------------------------
 * Fetches and displays PC recommendations based on user preferences.
 *
 * INPUTS:
 *   - prefs: The user's preferences (budget, storage) from the URL
 *
 * OUTPUTS:
 *   - Renders a list of PC recommendation cards (or loading/error states)
 * -----------------------------------------------------------------------------
 */
export function ResultsClient({ prefs }: { prefs: UserPreferences }) {
  // STATE: Track loading, errors, and results
  const [loading, setLoading] = useState(true); // Start in loading state
  const [error, setError] = useState<string | null>(null); // No error initially
  const [recommendations, setRecommendations] = useState<PcRecommendation[]>(
    []
  ); // Empty array initially
  const [usedMockData, setUsedMockData] = useState(false); // Tracks if using test data

  // Create a summary string to show the user their selections
  // useMemo prevents recalculating this on every render
  const summary = useMemo(() => {
    const pieces = [
      `Budget: ${prefs.budgetRange}`,
      `Storage: ${prefs.minSsdStorageTier}`,
    ];
    return pieces.join(" • "); // Example: "Budget: 700-999 • Storage: 1tb"
  }, [prefs]);

  // useEffect runs when the component loads (and when prefs change)
  useEffect(() => {
    let cancelled = false; // Flag to prevent updating state if component unmounts

    // Async function to fetch recommendations from our API
    async function run() {
      try {
        setLoading(true); // Show loading spinner
        setError(null); // Clear any previous errors

        // Call our API endpoint with user preferences
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefs), // Send preferences as JSON
        });

        // Check if request failed
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        // Parse the JSON response
        const data = (await res.json()) as {
          recommendations: PcRecommendation[];
          usedMockData: boolean;
        };

        // Only update state if component is still mounted
        if (cancelled) return;
        setRecommendations(data.recommendations ?? []); // Store the recommendations
        setUsedMockData(Boolean(data.usedMockData)); // Track if using mock data
      } catch (e) {
        if (cancelled) return;
        // Store error message for display
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        // Always turn off loading when done (success or error)
        if (!cancelled) setLoading(false);
      }
    }

    run(); // Start fetching

    // Cleanup function - runs when component unmounts
    return () => {
      cancelled = true;
    };
  }, [prefs]); // Re-run effect if prefs change

  return (
    <div className="space-y-4">
      {/* Summary box showing user's selections */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <div className="font-medium">Your choices</div>
        <div className="mt-1 text-xs text-zinc-500">{summary}</div>
        {/* Warning banner if using mock data */}
        {usedMockData ? (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Using mock data (Canopy not configured yet).
          </div>
        ) : null}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          Loading recommendations…
        </div>
      ) : null}

      {/* Error state */}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {/* Empty results state */}
      {!loading && !error && recommendations.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          No matches found with strict filters. Try widening budget or choosing
          Any color/storage.
        </div>
      ) : null}

      {/* Recommendation cards - one PCCard per recommendation */}
      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <PCCard key={rec.listing.id} rec={rec} />
        ))}
      </div>

      {/* Disclaimer at bottom */}
      <p className="text-xs text-zinc-500">
        Verify specs and price on Amazon before buying.
      </p>
    </div>
  );
}
