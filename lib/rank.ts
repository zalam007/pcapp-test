/**
 * =============================================================================
 * RANK - PC Scoring and Filtering Logic
 * =============================================================================
 * 
 * This file handles all the logic for filtering and scoring PCs based on
 * user preferences. It's the "brain" of the recommendation system.
 * 
 * HOW IT WORKS:
 *   1. Filter out PCs that don't meet basic requirements (price, storage)
 *   2. Score each remaining PC based on CPU, GPU, and RAM quality
 *   3. Return the top 5 highest-scoring PCs
 * 
 * MAIN FUNCTIONS:
 *   - budgetRangeToMinMax(): Converts budget option to price range
 *   - storageTierToMinGb(): Converts storage option to minimum GB
 *   - inferCpuTier(): Figures out how good a CPU is (1-5 scale)
 *   - inferGpuTier(): Figures out how good a GPU is (1-5 scale)
 *   - strictMeetsRequirements(): Checks if a PC has all required data
 *   - recommendFromCandidates(): Main function - filters and ranks PCs
 * =============================================================================
 */

import type { PcListing, PcRecommendation, UserPreferences } from "@/types/pc";


/**
 * -----------------------------------------------------------------------------
 * budgetRangeToMinMax()
 * -----------------------------------------------------------------------------
 * Converts a budget range option (like "700-999") into actual dollar amounts.
 * 
 * INPUTS:
 *   - budgetRange: The budget option the user selected
 * 
 * OUTPUTS:
 *   - Object with min and max price in dollars
 *   - Example: "700-999" returns { min: 700, max: 999 }
 * -----------------------------------------------------------------------------
 */
export function budgetRangeToMinMax(budgetRange: UserPreferences["budgetRange"]): {
  min: number;
  max: number;
} {
  switch (budgetRange) {
    case "under700":
      return { min: 0, max: 700 };         // Under $700
    case "700-999":
      return { min: 700, max: 999 };       // $700 to $999
    case "1000-1499":
      return { min: 1000, max: 1499 };     // $1000 to $1499
    case "1500plus":
      return { min: 1500, max: Infinity }; // $1500 and up (no max)
  }
}


/**
 * -----------------------------------------------------------------------------
 * storageTierToMinGb()
 * -----------------------------------------------------------------------------
 * Converts a storage tier option into the minimum gigabytes required.
 * 
 * INPUTS:
 *   - tier: The storage option the user selected
 * 
 * OUTPUTS:
 *   - Minimum storage in GB, or null if user has no preference
 *   - Example: "1tb" returns 1024 (because 1TB = 1024GB)
 * -----------------------------------------------------------------------------
 */
export function storageTierToMinGb(tier: UserPreferences["minSsdStorageTier"]): number | null {
  switch (tier) {
    case "256-512":
      return 256;    // At least 256GB
    case "1tb":
      return 1024;   // At least 1TB (1024GB)
    case "2tb":
      return 2048;   // At least 2TB (2048GB)
    case "any":
      return null;   // No minimum - user doesn't care
  }
}


/**
 * -----------------------------------------------------------------------------
 * clamp()
 * -----------------------------------------------------------------------------
 * Keeps a number within a range. If too low, returns min. If too high, returns max.
 * 
 * INPUTS:
 *   - value: The number to clamp
 *   - min: Minimum allowed value
 *   - max: Maximum allowed value
 * 
 * OUTPUTS:
 *   - The clamped number
 *   - Example: clamp(150, 0, 100) returns 100
 * -----------------------------------------------------------------------------
 */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}


/**
 * -----------------------------------------------------------------------------
 * inferCpuTier()
 * -----------------------------------------------------------------------------
 * Figures out how good a CPU is by reading its name.
 * Returns a tier from 1 (weak) to 5 (high-end).
 * 
 * INPUTS:
 *   - cpuText: CPU name like "Intel Core i7-13700F" or "AMD Ryzen 5 7600"
 * 
 * OUTPUTS:
 *   - Number 1-5 representing CPU quality
 *   - 5 = i9/Ryzen 9 (high-end)
 *   - 4 = i7/Ryzen 7 (good)
 *   - 3 = i5/Ryzen 5 (mid-range)
 *   - 2 = i3/Ryzen 3 (budget)
 *   - 1 = Celeron/Pentium (low-end)
 * -----------------------------------------------------------------------------
 */
function inferCpuTier(cpuText: string): number {
  const t = cpuText.toLowerCase(); // Convert to lowercase for easier matching
  
  // Low-end CPUs
  if (/(celeron|pentium|athlon)/.test(t)) return 1;

  // Apple Silicon (Mac CPUs)
  if (/m[1-9]/.test(t)) {
    if (/max/.test(t)) return 5;  // M1/M2 Max
    if (/pro/.test(t)) return 4;  // M1/M2 Pro
    return 3;                      // Base M1/M2
  }

  // Intel Core processors
  if (/\bi9\b/.test(t)) return 5;  // Core i9 = high-end
  if (/\bi7\b/.test(t)) return 4;  // Core i7 = good
  if (/\bi5\b/.test(t)) return 3;  // Core i5 = mid-range
  if (/\bi3\b/.test(t)) return 2;  // Core i3 = budget

  // AMD Ryzen processors
  if (/ryzen\s*9/.test(t)) return 5;  // Ryzen 9 = high-end
  if (/ryzen\s*7/.test(t)) return 4;  // Ryzen 7 = good
  if (/ryzen\s*5/.test(t)) return 3;  // Ryzen 5 = mid-range
  if (/ryzen\s*3/.test(t)) return 2;  // Ryzen 3 = budget

  return 2; // Default if we can't identify it
}


/**
 * -----------------------------------------------------------------------------
 * inferGpuTier()
 * -----------------------------------------------------------------------------
 * Figures out how good a GPU (graphics card) is by reading its name.
 * Returns tier (1-5) and whether it's a dedicated graphics card.
 * 
 * INPUTS:
 *   - gpuText: GPU name like "NVIDIA GeForce RTX 4070" or "AMD Radeon RX 7800"
 * 
 * OUTPUTS:
 *   - tier: Number 0-5 representing GPU quality (0 = integrated/none)
 *   - isDiscrete: true if it's a dedicated graphics card
 * -----------------------------------------------------------------------------
 */
function inferGpuTier(gpuText: string | undefined): { tier: number; isDiscrete: boolean } {
  // No GPU listed
  if (!gpuText) return { tier: 0, isDiscrete: false };
  
  const t = gpuText.toLowerCase(); // Convert to lowercase for easier matching

  // Check for integrated graphics (built into CPU, not a real gaming GPU)
  if (/(uhd|iris|xe\b|intel graphics|radeon graphics)/.test(t) && !/\brx\s*\d{4}\b/.test(t)) {
    return { tier: 0, isDiscrete: false };
  }

  // NVIDIA RTX cards (gaming GPUs)
  const rtx = t.match(/rtx\s*(\d{4})/);
  if (rtx) {
    const model = Number(rtx[1]); // Extract model number (4070, 4080, etc.)
    if (model >= 4080) return { tier: 5, isDiscrete: true };  // RTX 4080/4090 = top tier
    if (model >= 4070) return { tier: 4, isDiscrete: true };  // RTX 4070 = great
    if (model >= 4060) return { tier: 3, isDiscrete: true };  // RTX 4060 = good
    if (model >= 3060) return { tier: 2, isDiscrete: true };  // RTX 3060 = decent
    return { tier: 1, isDiscrete: true };
  }

  // NVIDIA GTX cards (older gaming GPUs)
  const gtx = t.match(/gtx\s*(\d{4})/);
  if (gtx) {
    const model = Number(gtx[1]);
    if (model >= 1660) return { tier: 1, isDiscrete: true };  // GTX 1660 = entry gaming
    return { tier: 1, isDiscrete: true };
  }

  // AMD RX cards (gaming GPUs)
  const rx = t.match(/\brx\s*(\d{4})/);
  if (rx) {
    const model = Number(rx[1]);
    if (model >= 7900) return { tier: 5, isDiscrete: true };  // RX 7900 = top tier
    if (model >= 7800) return { tier: 4, isDiscrete: true };  // RX 7800 = great
    if (model >= 7600) return { tier: 3, isDiscrete: true };  // RX 7600 = good
    if (model >= 6600) return { tier: 2, isDiscrete: true };  // RX 6600 = decent
    return { tier: 1, isDiscrete: true };
  }

  // Intel Arc cards (newer gaming GPUs)
  const arc = t.match(/\barc\s*a(\d{3})/);
  if (arc) {
    const model = Number(arc[1]);
    if (model >= 770) return { tier: 3, isDiscrete: true };   // Arc A770 = good
    if (model >= 750) return { tier: 2, isDiscrete: true };   // Arc A750 = decent
    return { tier: 1, isDiscrete: true };
  }

  // If it mentions a known GPU brand, assume it's discrete but low-tier
  if (/(rtx|gtx|\brx\b|arc)/.test(t)) return { tier: 1, isDiscrete: true };

  return { tier: 0, isDiscrete: false }; // Unknown or no discrete GPU
}


/**
 * -----------------------------------------------------------------------------
 * inferRamScore()
 * -----------------------------------------------------------------------------
 * Scores RAM amount on a simple scale.
 * 
 * INPUTS:
 *   - ramGb: Amount of RAM in gigabytes
 * 
 * OUTPUTS:
 *   - Score 0-3 based on RAM amount
 * -----------------------------------------------------------------------------
 */
function inferRamScore(ramGb: number): number {
  if (ramGb >= 32) return 3;  // 32GB+ = excellent
  if (ramGb >= 16) return 2;  // 16GB = good (standard for gaming)
  if (ramGb >= 8) return 1;   // 8GB = minimum
  return 0;                    // Less than 8GB = not enough
}


/**
 * -----------------------------------------------------------------------------
 * strictMeetsRequirements()
 * -----------------------------------------------------------------------------
 * Checks if a PC listing has all the required data to be considered.
 * PCs missing essential info get filtered out.
 * 
 * INPUTS:
 *   - listing: A PC product to check
 * 
 * OUTPUTS:
 *   - ok: true if PC has all required data
 *   - reason: Why the PC was rejected (if ok is false)
 * -----------------------------------------------------------------------------
 */
export function strictMeetsRequirements(listing: PcListing): {
  ok: boolean;
  reason?: string;
} {
  // Must have a valid price
  if (!Number.isFinite(listing.priceUsd) || listing.priceUsd <= 0) {
    return { ok: false, reason: "Missing price" };
  }
  // Must have Amazon URL
  if (!listing.amazonUrl) {
    return { ok: false, reason: "Missing URL" };
  }
  // Must have CPU info
  if (!listing.cpu) {
    return { ok: false, reason: "Missing CPU" };
  }
  // Must have valid RAM amount
  if (!Number.isFinite(listing.ramGb) || listing.ramGb <= 0) {
    return { ok: false, reason: "Missing RAM" };
  }

  return { ok: true }; // All checks passed!
}


/**
 * -----------------------------------------------------------------------------
 * recommendFromCandidates()
 * -----------------------------------------------------------------------------
 * THE MAIN FUNCTION - Takes a list of PCs and user preferences, returns the
 * top recommendations.
 * 
 * HOW IT WORKS:
 *   1. Filter out PCs missing required data
 *   2. Filter out PCs outside the budget range (with 12% tolerance)
 *   3. Filter out PCs with less storage than requested
 *   4. Score remaining PCs based on CPU + GPU + RAM quality
 *   5. Sort by score (highest first) and return top 5
 * 
 * INPUTS:
 *   - candidates: Array of PCs to consider
 *   - prefs: User's preferences (budget, storage)
 *   - options: Optional settings like limit (default 5)
 * 
 * OUTPUTS:
 *   - Array of PcRecommendation objects (PC + score + reasons)
 * -----------------------------------------------------------------------------
 */
export function recommendFromCandidates(
  candidates: PcListing[],
  prefs: UserPreferences,
  options?: { limit?: number; budgetTolerancePct?: number }
): PcRecommendation[] {
  // Settings with defaults
  const limit = options?.limit ?? 5;              // Return top 5 by default
  const tolerancePct = options?.budgetTolerancePct ?? 0.12; // 12% price tolerance

  // Convert user's budget selection to actual dollar amounts
  const { min: budgetMin, max: budgetMax } = budgetRangeToMinMax(prefs.budgetRange);
  
  // Apply tolerance (allow PCs slightly outside budget)
  const budgetMinTol = budgetMin === 0 ? 0 : budgetMin * (1 - tolerancePct);
  const budgetMaxTol = budgetMax === Infinity ? Infinity : budgetMax * (1 + tolerancePct);

  // Convert storage selection to minimum GB
  const minStorageGb = storageTierToMinGb(prefs.minSsdStorageTier);

  // STEP 1-3: Filter PCs based on requirements
  const filtered = candidates
    .filter((c) => strictMeetsRequirements(c).ok)  // Has all required data
    .filter((c) => c.priceUsd >= budgetMinTol && c.priceUsd <= budgetMaxTol)  // Within budget
    .filter((c) => {
      if (minStorageGb == null) return true;       // No storage preference = include all
      if (!c.storageGb) return true;               // Unknown storage = don't exclude
      return c.storageGb >= minStorageGb;          // Has enough storage
    });

  // Scoring weights - how much each component matters
  const weights = { cpu: 0.4, gpu: 0.4, ram: 0.2 }; // CPU and GPU most important

  // STEP 4-5: Score and rank the filtered PCs
  const recs = filtered
    .map((listing) => {
      // Get quality scores for each component
      const cpuTier = inferCpuTier(listing.cpu);
      const gpuInfo = inferGpuTier(listing.gpu);
      const ramScore = inferRamScore(listing.ramGb);

      // Calculate performance score (weighted average)
      const perf = weights.cpu * cpuTier + weights.gpu * gpuInfo.tier + weights.ram * ramScore;

      // Budget fit bonus - PCs closer to middle of budget range get a small boost
      const rangeMid =
        budgetMax === Infinity ? budgetMin * 1.2 : (budgetMin + budgetMax) / 2;
      const budgetFit =
        rangeMid <= 0
          ? 0
          : 1 - clamp(Math.abs(listing.priceUsd - rangeMid) / rangeMid, 0, 1);

      // Final score combines performance and budget fit
      const score = Math.round((perf * 20 + budgetFit * 20) * 10) / 10;

      // Build the "reasons" list shown to user
      const reasons: string[] = [];
      reasons.push(`CPU: ${listing.cpu}`);
      if (gpuInfo.isDiscrete && listing.gpu) reasons.push(`GPU: ${listing.gpu}`);
      reasons.push(`${listing.ramGb}GB RAM`);
      if (listing.storageGb) {
        // Format storage nicely (1024GB -> 1TB)
        reasons.push(`${listing.storageGb >= 1024 ? `${listing.storageGb / 1024}TB` : `${listing.storageGb}GB`} ${listing.storageType ?? "Storage"}`);
      }

      return { listing, score, reasons } satisfies PcRecommendation;
    })
    .sort((a, b) => b.score - a.score)  // Sort by score (highest first)
    .slice(0, limit);                    // Take only top N

  return recs;
}
