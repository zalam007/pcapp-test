export type BudgetRange = "under700" | "700-999" | "1000-1499" | "1500plus";
export type StorageTier = "256-512" | "1tb" | "2tb" | "any";

export interface UserPreferences {
  budgetRange: BudgetRange;
  minSsdStorageTier: StorageTier;
}

export interface PcListing {
  id: string;
  title: string;
  amazonUrl: string;
  priceUsd: number;

  cpu: string;
  gpu?: string;
  ramGb: number;

  storageGb?: number;
  storageType?: "SSD" | "HDD" | "Unknown";

  color?: string;
  imageUrl?: string;
}

export interface PcRecommendation {
  listing: PcListing;
  score: number;
  reasons: string[];
}
