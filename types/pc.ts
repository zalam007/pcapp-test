/**
 * =============================================================================
 * PC TYPES - TypeScript Type Definitions
 * =============================================================================
 * 
 * This file defines all the data types used throughout the app.
 * TypeScript uses these to catch errors and provide better code suggestions.
 * 
 * TYPES IN THIS FILE:
 *   - BudgetRange: The budget options users can select
 *   - StorageTier: The storage options users can select
 *   - UserPreferences: The user's form answers
 *   - PcListing: A PC product from Amazon
 *   - PcRecommendation: A PC with its score and reasons
 * =============================================================================
 */

// BudgetRange = the budget dropdown options
// "under700" means under $700, "700-999" means $700-$999, etc.
export type BudgetRange = "under700" | "700-999" | "1000-1499" | "1500plus";

// StorageTier = the storage dropdown options
// "1tb" means at least 1TB SSD, "any" means no preference
export type StorageTier = "256-512" | "1tb" | "2tb" | "any";

// UserPreferences = what the user selected in the form
export interface UserPreferences {
  budgetRange: BudgetRange;      // Which budget option they picked
  minSsdStorageTier: StorageTier; // Which storage option they picked
}

// PcListing = a PC product we found on Amazon
export interface PcListing {
  id: string;           // Unique identifier (we use the Amazon URL)
  title: string;        // Full product title from Amazon
  amazonUrl: string;    // Link to buy on Amazon
  priceUsd: number;     // Price in dollars

  cpu: string;          // CPU name like "Intel Core i7"
  gpu?: string;         // GPU name like "RTX 4070" (optional - some PCs don't list it)
  ramGb: number;        // RAM in gigabytes like 16 or 32

  storageGb?: number;   // Storage size in GB (optional)
  storageType?: "SSD" | "HDD" | "Unknown"; // Type of storage

  color?: string;       // Case color (optional)
  imageUrl?: string;    // Product image URL (optional)
}

// PcRecommendation = a PC listing with its score and why we recommend it
export interface PcRecommendation {
  listing: PcListing;   // The PC product data
  score: number;        // Performance score (higher is better)
  reasons: string[];    // List of reasons why it's good (shown to user)
}
