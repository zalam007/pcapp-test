/**
 * =============================================================================
 * PC RECOMMENDER API ROUTE
 * =============================================================================
 * 
 * This file handles the backend logic for recommending PCs to users.
 * It's a Next.js API route that:
 *   1. Receives user preferences (budget, storage) from the frontend
 *   2. Searches Amazon via the Canopy API for gaming PCs
 *   3. Parses product titles to extract specs (CPU, GPU, RAM, storage)
 *   4. Ranks and filters results based on user preferences
 *   5. Returns top 5 recommendations
 * 
 * ENDPOINT: POST /api/recommend
 * 
 * REQUEST BODY (JSON):
 *   {
 *     "budgetRange": "700-999",
 *     "minSsdStorageTier": "1tb"
 *   }
 * 
 * RESPONSE (JSON):
 *   {
 *     "recommendations": [...],
 *     "usedMockData": false
 *   }
 * =============================================================================
 */

import { NextResponse } from "next/server";

import type { CanopyProductResult } from "@/lib/canopyClient";
import { getCanopyClientFromEnv } from "@/lib/canopyClient";
import { MOCK_CANDIDATES } from "@/lib/mockCandidates";
import { budgetRangeToMinMax, recommendFromCandidates } from "@/lib/rank";
import type { PcListing, UserPreferences } from "@/types/pc";


/**
 * -----------------------------------------------------------------------------
 * buildQuery()
 * -----------------------------------------------------------------------------
 * Returns the search term we use to find gaming PCs on Amazon.
 * -----------------------------------------------------------------------------
 */
function buildQuery(): string {
  return "gaming desktop computer PC";
}


/**
 * -----------------------------------------------------------------------------
 * parseRamGb(text)
 * -----------------------------------------------------------------------------
 * Looks for RAM size in a product title and returns it as a number.
 * 
 * Examples it can find: "32GB DDR4 RAM", "16GB RAM", "32 GB DDR5"
 * 
 * INPUTS: text - the product title to search
 * OUTPUTS: number (like 32) or null if not found
 * -----------------------------------------------------------------------------
 */
function parseRamGb(text: string): number | null {
  // Try to find patterns like "32GB DDR4 RAM" or "16GB RAM"
  const ramMatch = text.match(/\b(\d{1,3})\s*GB\s*(?:DDR[45]\s*)?RAM\b/i);
  if (ramMatch) return Number(ramMatch[1]);
  
  // Try without "RAM" suffix: "32GB DDR5"
  const ddrMatch = text.match(/\b(\d{1,3})\s*GB\s*DDR[45]\b/i);
  if (ddrMatch) return Number(ddrMatch[1]);
  
  return null;
}


/**
 * -----------------------------------------------------------------------------
 * parseStorage(text)
 * -----------------------------------------------------------------------------
 * Looks for storage size and type (SSD/HDD) in a product title.
 * 
 * Examples: "1TB NVMe SSD" → { gb: 1024, type: "SSD" }
 * 
 * INPUTS: text - the product title to search
 * OUTPUTS: { gb: number, type: "SSD"|"HDD"|"Unknown" } or undefined if not found
 * -----------------------------------------------------------------------------
 */
function parseStorage(text: string): { gb?: number; type?: PcListing["storageType"] } {
  const lowerText = text.toLowerCase();
  const isSsd = /(nvme|ssd)/.test(lowerText);
  const isHdd = /\bhdd\b/.test(lowerText);

  // Look for TB sizes like "1TB", "2TB"
  const tbMatch = text.match(/\b(\d+(?:\.\d+)?)\s*TB\b/i);
  if (tbMatch) {
    const gb = Math.round(Number(tbMatch[1]) * 1024);
    return { gb, type: isSsd ? "SSD" : isHdd ? "HDD" : "Unknown" };
  }

  // Look for GB sizes like "512GB" (3-4 digits to avoid matching RAM)
  const gbMatch = text.match(/\b(\d{3,4})\s*GB\b/i);
  if (gbMatch) {
    const gb = Number(gbMatch[1]);
    return { gb, type: isSsd ? "SSD" : isHdd ? "HDD" : "Unknown" };
  }

  return { gb: undefined, type: undefined };
}


/**
 * -----------------------------------------------------------------------------
 * parseCpu(text)
 * -----------------------------------------------------------------------------
 * Looks for CPU model in a product title.
 * 
 * Examples: "Intel Core i7", "AMD Ryzen 7", "Apple M2 Pro"
 * 
 * INPUTS: text - the product title to search
 * OUTPUTS: CPU name as string, or null if not found
 * -----------------------------------------------------------------------------
 */
function parseCpu(text: string): string | null {
  // Look for Intel CPUs like "Intel Core i7"
  const intelMatch = text.match(/\b(Intel\s+Core\s+i[3579])\b/i);
  if (intelMatch) return intelMatch[1];
  
  // Look for AMD CPUs like "AMD Ryzen 7"
  const amdMatch = text.match(/\b(AMD\s+Ryzen\s+[3579])\b/i);
  if (amdMatch) return amdMatch[1];
  
  // Look for Apple chips like "Apple M2 Pro"
  const appleMatch = text.match(/\b(Apple\s+M\d(?:\s+Pro|\s+Max)?)\b/i);
  if (appleMatch) return appleMatch[1];
  
  return null;
}


/**
 * -----------------------------------------------------------------------------
 * parseGpu(text)
 * -----------------------------------------------------------------------------
 * Looks for GPU (graphics card) model in a product title.
 * 
 * Examples: "GeForce RTX 4070", "Radeon RX 7800 XT"
 * 
 * INPUTS: text - the product title to search
 * OUTPUTS: GPU name with brand prefix, or null if not found
 * -----------------------------------------------------------------------------
 */
function parseGpu(text: string): string | null {
  // Look for NVIDIA RTX cards like "GeForce RTX 4070 Ti"
  const rtxMatch = text.match(/\b(GeForce\s+RTX\s*\d{4}(?:\s*(?:Ti|SUPER))?)\b/i);
  if (rtxMatch) return `NVIDIA ${rtxMatch[1]}`;
  
  // Look for NVIDIA GTX cards like "GeForce GTX 1660"
  const gtxMatch = text.match(/\b(GeForce\s+GTX\s*\d{4}(?:\s*SUPER)?)\b/i);
  if (gtxMatch) return `NVIDIA ${gtxMatch[1]}`;
  
  // Look for AMD Radeon cards like "Radeon RX 7800 XT"
  const radeonMatch = text.match(/\b(Radeon\s+RX\s*\d{4}(?:\s*XT)?)\b/i);
  if (radeonMatch) return `AMD ${radeonMatch[1]}`;
  
  // Look for Intel Arc GPUs like "Intel Arc A770"
  const arcMatch = text.match(/\b(Intel\s+Arc\s+A\d{3})\b/i);
  if (arcMatch) return arcMatch[1];
  
  return null;
}


/**
 * -----------------------------------------------------------------------------
 * mapCanopyResultToListing(raw)
 * -----------------------------------------------------------------------------
 * Converts a raw Canopy API result into our PcListing format.
 * Parses the title to extract CPU, GPU, RAM, and storage specs.
 * 
 * INPUTS: raw - product data from Canopy API
 * OUTPUTS: PcListing object, or null if missing required data
 * -----------------------------------------------------------------------------
 */
function mapCanopyResultToListing(raw: CanopyProductResult): PcListing | null {
  const { title, url: amazonUrl, price, mainImageUrl } = raw;
  
  // Skip if missing price, title, or URL
  if (!price || price.value == null) return null;
  if (!title || !amazonUrl) return null;

  // Extract specs from the title
  const cpu = parseCpu(title);
  const ramGb = parseRamGb(title);
  const gpu = parseGpu(title) ?? undefined;
  const storage = parseStorage(title);

  // Skip if we couldn't find CPU or RAM (needed for scoring)
  if (!cpu || ramGb == null) return null;

  return {
    id: amazonUrl,
    title,
    amazonUrl,
    priceUsd: price.value,
    cpu,
    gpu,
    ramGb,
    storageGb: storage.gb,
    storageType: storage.type,
    imageUrl: mainImageUrl,
  };
}


/**
 * =============================================================================
 * POST Handler - Main API Endpoint
 * =============================================================================
 * This is the main function that runs when the frontend submits the form.
 * 
 * WHAT IT DOES:
 *   1. Gets the user's answers (budget, storage) from the form submission
 *   2. Searches Amazon for gaming PCs using those preferences
 *   3. Parses the product titles to extract specs (CPU, GPU, RAM)
 *   4. Scores and ranks the PCs based on performance
 *   5. Returns the top 5 best matches to show the user
 * 
 * HOW IT'S CALLED:
 *   The frontend (ResultsClient.tsx) makes a POST request to /api/recommend
 *   with the user's form answers in the request body as JSON.
 * 
 * INPUTS:
 *   req - The HTTP request object containing the user's preferences as JSON
 *         Example: { "budgetRange": "700-999", "minSsdStorageTier": "1tb" }
 * 
 * OUTPUTS:
 *   JSON response with:
 *   - recommendations: Array of top 5 PCs with scores and reasons
 *   - usedMockData: true if we couldn't reach the real API (for testing)
 * =============================================================================
 */
export async function POST(req: Request) {
  // prefs = the user's form answers (budget range and storage preference)
  // await req.json() reads the JSON data sent from the frontend form
  const prefs = (await req.json()) as UserPreferences;

  // canopy = connection to the Canopy API (which searches Amazon for us)
  // Returns null if the API key isn't set up in .env.local
  const canopy = getCanopyClientFromEnv();
  console.log("Canopy client:", canopy ? "configured" : "NOT configured");

  // candidates = list of PCs we found that we'll score and rank
  let candidates: PcListing[] = [];
  
  // usedMockData = tracks if we're using fake test data instead of real Amazon data
  let usedMockData = false;

  // Only search Amazon if we have a working Canopy connection
  if (canopy) {
    try {
      // query = the search term we send to Amazon (e.g., "gaming desktop computer PC")
      const query = buildQuery();
      
      // budgetMin/budgetMax = convert user's selection like "700-999" into numbers (700, 999)
      const { min: budgetMin, max: budgetMax } = budgetRangeToMinMax(prefs.budgetRange);
      console.log("Calling Canopy with:", { query, budgetMin, budgetMax });

      // results = raw product data from Amazon (titles, prices, URLs, images)
      const results = await canopy.searchAmazon({
        searchTerm: query,
        minPrice: budgetMin > 0 ? budgetMin : undefined,
        maxPrice: budgetMax !== Infinity ? budgetMax : undefined,
        limit: 40,
      });
      console.log("Canopy returned", results.length, "results");

      // Convert raw Amazon data into our format and extract specs from titles
      // .map() transforms each result, .filter() removes ones that failed to parse
      candidates = results
        .map(mapCanopyResultToListing)
        .filter((x): x is PcListing => Boolean(x));
      console.log("After parsing:", candidates.length, "valid candidates");
      
    } catch (err) {
      // If something goes wrong (network error, API down), use fake test data instead
      console.error("Canopy search failed:", err);
      candidates = MOCK_CANDIDATES;
      usedMockData = true;
    }
  } else {
    // No API connection - use fake test data for development
    console.log("Using mock data - Canopy not configured");
    candidates = MOCK_CANDIDATES;
    usedMockData = true;
  }

  // recs = final recommendations after scoring and ranking the candidates
  // Takes all the PCs we found, scores them by CPU+GPU+RAM, returns top 5
  const recs = recommendFromCandidates(candidates, prefs, { limit: 5 });

  // Send the results back to the frontend as JSON
  return NextResponse.json({
    recommendations: recs,
    usedMockData,
  });
}
