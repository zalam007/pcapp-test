"use client";

import { useEffect, useMemo, useState } from "react";

import { PCCard } from "@/components/PCCard";
import type { PcRecommendation, UserPreferences } from "@/types/pc";

export function ResultsClient({ prefs }: { prefs: UserPreferences }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<PcRecommendation[]>(
    []
  );
  const [usedMockData, setUsedMockData] = useState(false);

  const summary = useMemo(() => {
    const pieces = [
      `Budget: ${prefs.budgetRange}`,
      `Storage: ${prefs.minSsdStorageTier}`,
    ];
    return pieces.join(" • ");
  }, [prefs]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefs),
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = (await res.json()) as {
          recommendations: PcRecommendation[];
          usedMockData: boolean;
        };

        if (cancelled) return;
        setRecommendations(data.recommendations ?? []);
        setUsedMockData(Boolean(data.usedMockData));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [prefs]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <div className="font-medium">Your choices</div>
        <div className="mt-1 text-xs text-zinc-500">{summary}</div>
        {usedMockData ? (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Using mock data (Canopy not configured yet).
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          Loading recommendations…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && recommendations.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          No matches found with strict filters. Try widening budget or choosing
          Any color/storage.
        </div>
      ) : null}

      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <PCCard key={rec.listing.id} rec={rec} />
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Verify specs and price on Amazon before buying.
      </p>
    </div>
  );
}
