/**
 * =============================================================================
 * MOCK CANDIDATES - Test Data for Development
 * =============================================================================
 * 
 * This file contains fake PC data used for testing when the Canopy API isn't
 * available (like when the API key isn't set up yet).
 * 
 * WHY WE NEED THIS:
 *   - Testing the UI without making real API calls
 *   - Development when you don't have an API key yet
 *   - Fallback if the API is down
 * 
 * The data follows the same PcListing format as real API results.
 * =============================================================================
 */

import type { PcListing } from "@/types/pc";

// Array of fake PC products for testing
export const MOCK_CANDIDATES: PcListing[] = [
  {
    // Mock PC #1 - Mid-range gaming PC
    id: "mock-1",
    title: "CyberPowerPC Gamer Xtreme VR Gaming PC (Intel Core i5, RTX 4060, 16GB RAM, 1TB NVMe SSD)",
    amazonUrl: "https://www.amazon.com/",
    priceUsd: 1099,
    cpu: "Intel Core i5",
    gpu: "NVIDIA GeForce RTX 4060",
    ramGb: 16,
    storageGb: 1024,          // 1TB SSD
    storageType: "SSD",
    color: "black",
  },
  {
    // Mock PC #2 - Mid-range AMD build
    id: "mock-2",
    title: "Skytech Gaming Chronos Mini (Ryzen 5, RTX 4060 Ti, 16GB RAM, 1TB SSD)",
    amazonUrl: "https://www.amazon.com/",
    priceUsd: 1299,
    cpu: "AMD Ryzen 5",
    gpu: "NVIDIA GeForce RTX 4060 Ti",
    ramGb: 16,
    storageGb: 1024,          // 1TB SSD
    storageType: "SSD",
    color: "white",
  },
  {
    // Mock PC #3 - High-end gaming PC
    id: "mock-3",
    title: "iBUYPOWER Slate 8 Gaming Desktop (Intel Core i7, RTX 4070, 32GB RAM, 2TB NVMe SSD)",
    amazonUrl: "https://www.amazon.com/",
    priceUsd: 1899,
    cpu: "Intel Core i7",
    gpu: "NVIDIA GeForce RTX 4070",
    ramGb: 32,
    storageGb: 2048,          // 2TB SSD
    storageType: "SSD",
    color: "black",
  },
  {
    // Mock PC #4 - Budget office PC (no dedicated GPU)
    id: "mock-4",
    title: "Dell Inspiron Desktop (Intel Core i5, 16GB RAM, 512GB SSD)",
    amazonUrl: "https://www.amazon.com/",
    priceUsd: 749,
    cpu: "Intel Core i5",
    ramGb: 16,
    storageGb: 512,           // 512GB SSD
    storageType: "SSD",
    color: "silver",
  },
  {
    // Mock PC #5 - Entry-level budget PC
    id: "mock-5",
    title: "HP Pavilion Desktop (Intel Core i3, 8GB RAM, 256GB SSD)",
    amazonUrl: "https://www.amazon.com/",
    priceUsd: 499,
    cpu: "Intel Core i3",
    ramGb: 8,
    storageGb: 256,           // 256GB SSD
    storageType: "SSD",
    color: "black",
  },
];
