import { NextResponse } from "next/server";

import type { CanopyProductResult } from "@/lib/canopyClient";
import { getCanopyClientFromEnv } from "@/lib/canopyClient";
import { MOCK_CANDIDATES } from "@/lib/mockCandidates";
import { budgetRangeToMinMax, recommendFromCandidates } from "@/lib/rank";
import type { PcListing, UserPreferences } from "@/types/pc";

function buildQuery(): string {
  return "gaming desktop computer PC";
}

function parseRamGb(text: string): number | null {
  // Match patterns like "32GB DDR4 RAM", "16GB RAM", "32 GB DDR5"
  const match = text.match(/\b(\d{1,3})\s*GB\s*(?:DDR[45]\s*)?RAM\b/i);
  if (match) return Number(match[1]);
  // Also try "32GB DDR5" without RAM suffix
  const match2 = text.match(/\b(\d{1,3})\s*GB\s*DDR[45]\b/i);
  if (match2) return Number(match2[1]);
  return null;
}

function parseStorage(text: string): { gb?: number; type?: PcListing["storageType"] } {
  const lower = text.toLowerCase();
  const isSsd = /(nvme|ssd)/.test(lower);
  const isHdd = /\bhdd\b/.test(lower);

  const tbMatch = text.match(/\b(\d+(?:\.\d+)?)\s*TB\b/i);
  if (tbMatch) {
    const gb = Math.round(Number(tbMatch[1]) * 1024);
    return { gb, type: isSsd ? "SSD" : isHdd ? "HDD" : "Unknown" };
  }

  const gbMatch = text.match(/\b(\d{3,4})\s*GB\b/i);
  if (gbMatch) {
    const gb = Number(gbMatch[1]);
    return { gb, type: isSsd ? "SSD" : isHdd ? "HDD" : "Unknown" };
  }

  return { gb: undefined, type: undefined };
}

function parseCpu(text: string): string | null {
  const m = text.match(/\b(Intel\s+Core\s+i[3579])\b/i);
  if (m) return m[1];
  const r = text.match(/\b(AMD\s+Ryzen\s+[3579])\b/i);
  if (r) return r[1];
  const apple = text.match(/\b(Apple\s+M\d(?:\s+Pro|\s+Max)?)\b/i);
  if (apple) return apple[1];
  return null;
}

function parseGpu(text: string): string | null {
  const nvidia = text.match(/\b(GeForce\s+RTX\s*\d{4}(?:\s*(?:Ti|SUPER))?)\b/i);
  if (nvidia) return `NVIDIA ${nvidia[1]}`;
  const gtx = text.match(/\b(GeForce\s+GTX\s*\d{4}(?:\s*SUPER)?)\b/i);
  if (gtx) return `NVIDIA ${gtx[1]}`;
  const amd = text.match(/\b(Radeon\s+RX\s*\d{4}(?:\s*XT)?)\b/i);
  if (amd) return `AMD ${amd[1]}`;
  const arc = text.match(/\b(Intel\s+Arc\s+A\d{3})\b/i);
  if (arc) return arc[1];
  return null;
}

function inferColor(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes("white")) return "white";
  if (t.includes("silver") || t.includes("gray") || t.includes("grey")) return "silver";
  if (t.includes("black")) return "black";
  return undefined;
}

function mapCanopyResultToListing(raw: CanopyProductResult): PcListing | null {
  const { title, url: amazonUrl, price, mainImageUrl } = raw;
  
  // Handle null price
  if (!price || price.value == null) return null;
  const priceUsd = price.value;

  if (!title || !amazonUrl) return null;

  const cpu = parseCpu(title);
  const ramGb = parseRamGb(title);

  const gpu = parseGpu(title) ?? undefined;
  const storage = parseStorage(title);

  if (!cpu || ramGb == null) return null;

  return {
    id: amazonUrl,
    title,
    amazonUrl,
    priceUsd,
    cpu,
    gpu,
    ramGb,
    storageGb: storage.gb,
    storageType: storage.type,
    imageUrl: mainImageUrl,
    color: inferColor(title),
  };
}

export async function POST(req: Request) {
  const prefs = (await req.json()) as UserPreferences;

  // 1) Try Canopy (if configured)
  const canopy = getCanopyClientFromEnv();
  console.log("Canopy client:", canopy ? "configured" : "NOT configured");

  let candidates: PcListing[] = [];
  let usedMockData = false;

  if (canopy) {
    try {
      const query = buildQuery();
      const { min: budgetMin, max: budgetMax } = budgetRangeToMinMax(prefs.budgetRange);

      console.log("Calling Canopy with:", { query, budgetMin, budgetMax });

      const results = await canopy.searchAmazon({
        searchTerm: query,
        minPrice: budgetMin > 0 ? budgetMin : undefined,
        maxPrice: budgetMax !== Infinity ? budgetMax : undefined,
        limit: 40,
      });

      console.log("Canopy returned", results.length, "results");

      candidates = results
        .map(mapCanopyResultToListing)
        .filter((x): x is PcListing => Boolean(x));

      console.log("After parsing:", candidates.length, "valid candidates");
    } catch (err) {
      console.error("Canopy search failed:", err);
      candidates = MOCK_CANDIDATES;
      usedMockData = true;
    }
  } else {
    console.log("Using mock data - Canopy not configured");
    candidates = MOCK_CANDIDATES;
    usedMockData = true;
  }

  const recs = recommendFromCandidates(candidates, prefs, { limit: 5 });

  return NextResponse.json({
    recommendations: recs,
    usedMockData,
  });
}
