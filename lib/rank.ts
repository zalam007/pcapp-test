import type { PcListing, PcRecommendation, UserPreferences } from "@/types/pc";

export function budgetRangeToMinMax(budgetRange: UserPreferences["budgetRange"]): {
  min: number;
  max: number;
} {
  switch (budgetRange) {
    case "under700":
      return { min: 0, max: 700 };
    case "700-999":
      return { min: 700, max: 999 };
    case "1000-1499":
      return { min: 1000, max: 1499 };
    case "1500plus":
      return { min: 1500, max: Infinity };
  }
}

export function storageTierToMinGb(tier: UserPreferences["minSsdStorageTier"]): number | null {
  switch (tier) {
    case "256-512":
      return 256;
    case "1tb":
      return 1024;
    case "2tb":
      return 2048;
    case "any":
      return null;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function inferCpuTier(cpuText: string): number {
  const t = cpuText.toLowerCase();
  if (/(celeron|pentium|athlon)/.test(t)) return 1;

  // Apple
  if (/m[1-9]/.test(t)) {
    if (/max/.test(t)) return 5;
    if (/pro/.test(t)) return 4;
    return 3;
  }

  // Intel Core
  if (/\bi9\b/.test(t)) return 5;
  if (/\bi7\b/.test(t)) return 4;
  if (/\bi5\b/.test(t)) return 3;
  if (/\bi3\b/.test(t)) return 2;

  // Ryzen
  if (/ryzen\s*9/.test(t)) return 5;
  if (/ryzen\s*7/.test(t)) return 4;
  if (/ryzen\s*5/.test(t)) return 3;
  if (/ryzen\s*3/.test(t)) return 2;

  return 2;
}

function inferGpuTier(gpuText: string | undefined): { tier: number; isDiscrete: boolean } {
  if (!gpuText) return { tier: 0, isDiscrete: false };
  const t = gpuText.toLowerCase();

  // Integrated / unclear
  if (/(uhd|iris|xe\b|intel graphics|radeon graphics)/.test(t) && !/\brx\s*\d{4}\b/.test(t)) {
    return { tier: 0, isDiscrete: false };
  }

  // NVIDIA
  const rtx = t.match(/rtx\s*(\d{4})/);
  if (rtx) {
    const model = Number(rtx[1]);
    if (model >= 4080) return { tier: 5, isDiscrete: true };
    if (model >= 4070) return { tier: 4, isDiscrete: true };
    if (model >= 4060) return { tier: 3, isDiscrete: true };
    if (model >= 3060) return { tier: 2, isDiscrete: true };
    return { tier: 1, isDiscrete: true };
  }

  const gtx = t.match(/gtx\s*(\d{4})/);
  if (gtx) {
    const model = Number(gtx[1]);
    if (model >= 1660) return { tier: 1, isDiscrete: true };
    return { tier: 1, isDiscrete: true };
  }

  // AMD
  const rx = t.match(/\brx\s*(\d{4})/);
  if (rx) {
    const model = Number(rx[1]);
    if (model >= 7900) return { tier: 5, isDiscrete: true };
    if (model >= 7800) return { tier: 4, isDiscrete: true };
    if (model >= 7600) return { tier: 3, isDiscrete: true };
    if (model >= 6600) return { tier: 2, isDiscrete: true };
    return { tier: 1, isDiscrete: true };
  }

  // Intel Arc
  const arc = t.match(/\barc\s*a(\d{3})/);
  if (arc) {
    const model = Number(arc[1]);
    if (model >= 770) return { tier: 3, isDiscrete: true };
    if (model >= 750) return { tier: 2, isDiscrete: true };
    return { tier: 1, isDiscrete: true };
  }

  // If it contains a known discrete keyword, treat as discrete but low-tier
  if (/(rtx|gtx|\brx\b|arc)/.test(t)) return { tier: 1, isDiscrete: true };

  return { tier: 0, isDiscrete: false };
}

function inferRamScore(ramGb: number): number {
  if (ramGb >= 32) return 3;
  if (ramGb >= 16) return 2;
  if (ramGb >= 8) return 1;
  return 0;
}

export function strictMeetsRequirements(listing: PcListing): {
  ok: boolean;
  reason?: string;
} {
  if (!Number.isFinite(listing.priceUsd) || listing.priceUsd <= 0) {
    return { ok: false, reason: "Missing price" };
  }
  if (!listing.amazonUrl) {
    return { ok: false, reason: "Missing URL" };
  }
  if (!listing.cpu) {
    return { ok: false, reason: "Missing CPU" };
  }
  if (!Number.isFinite(listing.ramGb) || listing.ramGb <= 0) {
    return { ok: false, reason: "Missing RAM" };
  }

  return { ok: true };
}

export function recommendFromCandidates(
  candidates: PcListing[],
  prefs: UserPreferences,
  options?: { limit?: number; budgetTolerancePct?: number }
): PcRecommendation[] {
  const limit = options?.limit ?? 5;
  const tolerancePct = options?.budgetTolerancePct ?? 0.12;

  const { min: budgetMin, max: budgetMax } = budgetRangeToMinMax(prefs.budgetRange);
  const budgetMinTol = budgetMin === 0 ? 0 : budgetMin * (1 - tolerancePct);
  const budgetMaxTol = budgetMax === Infinity ? Infinity : budgetMax * (1 + tolerancePct);

  const minStorageGb = storageTierToMinGb(prefs.minSsdStorageTier);

  const filtered = candidates
    .filter((c) => strictMeetsRequirements(c).ok)
    .filter((c) => c.priceUsd >= budgetMinTol && c.priceUsd <= budgetMaxTol)
    .filter((c) => {
      if (minStorageGb == null) return true;
      if (!c.storageGb) return true; // Don't exclude if storage unknown
      return c.storageGb >= minStorageGb;
    });

  // Simple balanced scoring (CPU + GPU + RAM)
  const weights = { cpu: 0.4, gpu: 0.4, ram: 0.2 };

  const recs = filtered
    .map((listing) => {
      const cpuTier = inferCpuTier(listing.cpu);
      const gpuInfo = inferGpuTier(listing.gpu);
      const ramScore = inferRamScore(listing.ramGb);

      const perf = weights.cpu * cpuTier + weights.gpu * gpuInfo.tier + weights.ram * ramScore;

      // Light budget-fit boost (closer to middle of selected range is better)
      const rangeMid =
        budgetMax === Infinity ? budgetMin * 1.2 : (budgetMin + budgetMax) / 2;
      const budgetFit =
        rangeMid <= 0
          ? 0
          : 1 - clamp(Math.abs(listing.priceUsd - rangeMid) / rangeMid, 0, 1);

      const score = Math.round((perf * 20 + budgetFit * 20) * 10) / 10;

      const reasons: string[] = [];
      reasons.push(`CPU: ${listing.cpu}`);
      if (gpuInfo.isDiscrete && listing.gpu) reasons.push(`GPU: ${listing.gpu}`);
      reasons.push(`${listing.ramGb}GB RAM`);
      if (listing.storageGb) {
        reasons.push(`${listing.storageGb >= 1024 ? `${listing.storageGb / 1024}TB` : `${listing.storageGb}GB`} ${listing.storageType ?? "Storage"}`);
      }

      return { listing, score, reasons } satisfies PcRecommendation;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recs;
}
