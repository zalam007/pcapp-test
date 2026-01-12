"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { BudgetRange, StorageTier, UserPreferences } from "@/types/pc";

const budgetOptions: Array<{ value: BudgetRange; label: string }> = [
  { value: "under700", label: "Under $700" },
  { value: "700-999", label: "$700–$999" },
  { value: "1000-1499", label: "$1,000–$1,499" },
  { value: "1500plus", label: "$1,500+" },
];

const storageOptions: Array<{ value: StorageTier; label: string }> = [
  { value: "256-512", label: "256–512GB SSD" },
  { value: "1tb", label: "1TB SSD" },
  { value: "2tb", label: "2TB+ SSD" },
  { value: "any", label: "No preference" },
];

function toSearchParams(prefs: UserPreferences): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("budget", prefs.budgetRange);
  sp.set("storage", prefs.minSsdStorageTier);
  return sp;
}

export function PCQuestionForm() {
  const router = useRouter();

  const [budgetRange, setBudgetRange] = useState<BudgetRange>("700-999");
  const [minSsdStorageTier, setMinSsdStorageTier] =
    useState<StorageTier>("1tb");

  const prefs: UserPreferences = useMemo(
    () => ({ budgetRange, minSsdStorageTier }),
    [budgetRange, minSsdStorageTier]
  );

  return (
    <form
      className="w-full space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/results?${toSearchParams(prefs).toString()}`);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Budget</span>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={budgetRange}
            onChange={(e) => setBudgetRange(e.target.value as BudgetRange)}
          >
            {budgetOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

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

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-md bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Get recommendations
      </button>
    </form>
  );
}
