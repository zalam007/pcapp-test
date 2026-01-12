/**
 * =============================================================================
 * PC CARD - Individual Recommendation Display
 * =============================================================================
 *
 * This component displays a single PC recommendation as a card. Each card
 * shows the PC's title, price, specs, and a link to buy on Amazon.
 *
 * WHAT IT SHOWS:
 *   - Product title and price
 *   - Score (how well it matches user preferences)
 *   - Specs: CPU, GPU, RAM, Storage
 *   - List of reasons why we recommend it
 *   - "View on Amazon" button
 *
 * COMPONENTS:
 *   - PCCard: The main card component
 *   - Spec: Helper component for displaying a single spec (like "CPU: i7")
 * =============================================================================
 */

import type { PcRecommendation } from "@/types/pc";

/**
 * -----------------------------------------------------------------------------
 * PCCard Component
 * -----------------------------------------------------------------------------
 * Displays one PC recommendation in a styled card format.
 *
 * INPUTS:
 *   - rec: A PcRecommendation object containing the PC listing, score, and reasons
 *
 * OUTPUTS:
 *   - A styled card showing all the PC details
 * -----------------------------------------------------------------------------
 */
export function PCCard({ rec }: { rec: PcRecommendation }) {
  const { listing } = rec; // Extract the PC listing data

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header row: Title and Amazon button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* Product title */}
          <h3 className="text-base font-semibold leading-snug">
            {listing.title}
          </h3>
          {/* Price and score */}
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            ${listing.priceUsd.toLocaleString()} • Score {rec.score}
          </p>
        </div>
        {/* Amazon link button */}
        <a
          href={listing.amazonUrl}
          target="_blank" // Open in new tab
          rel="noreferrer" // Security best practice
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          View on Amazon
        </a>
      </div>

      {/* Specs grid - shows CPU, GPU, RAM, Storage */}
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <Spec label="CPU" value={listing.cpu} />
        <Spec label="GPU" value={listing.gpu ?? "Not specified"} />
        <Spec label="RAM" value={`${listing.ramGb}GB`} />
        <Spec
          label="Storage"
          value={
            listing.storageGb
              ? `${listing.storageGb}GB ${listing.storageType ?? ""}`.trim()
              : "Not specified"
          }
        />
      </div>

      {/* Reasons list - why we recommend this PC */}
      {rec.reasons.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          {rec.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * Spec Component
 * -----------------------------------------------------------------------------
 * A small helper component that displays a single specification.
 * Used to show CPU, GPU, RAM, and Storage in a consistent format.
 *
 * INPUTS:
 *   - label: The spec name (e.g., "CPU")
 *   - value: The spec value (e.g., "Intel Core i7")
 *
 * OUTPUTS:
 *   - A small styled box showing "CPU" above "Intel Core i7"
 * -----------------------------------------------------------------------------
 */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
      {/* Label in small caps */}
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      {/* Value in bold */}
      <div className="font-medium">{value}</div>
    </div>
  );
}
