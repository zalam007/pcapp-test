import type { PcRecommendation } from "@/types/pc";

export function PCCard({ rec }: { rec: PcRecommendation }) {
  const { listing } = rec;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold leading-snug">
            {listing.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            ${listing.priceUsd.toLocaleString()} • Score {rec.score}
          </p>
        </div>
        <a
          href={listing.amazonUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          View on Amazon
        </a>
      </div>

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

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
