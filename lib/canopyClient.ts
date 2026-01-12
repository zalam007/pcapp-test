/**
 * =============================================================================
 * CANOPY API CLIENT
 * =============================================================================
 * 
 * This file handles communication with the Canopy API, which lets us search
 * Amazon for products. Canopy is a third-party service that wraps Amazon's
 * product data API.
 * 
 * HOW IT WORKS:
 *   1. We send a search term (like "gaming desktop computer") to Canopy
 *   2. Canopy searches Amazon and returns product data
 *   3. We get back titles, prices, URLs, images, ratings, etc.
 * 
 * MAIN EXPORTS:
 *   - CanopyClient: Class that makes API calls to Canopy
 *   - getCanopyClientFromEnv(): Creates a client using .env.local settings
 *   - CanopyProductResult: Type for the product data we get back
 * =============================================================================
 */

// CanopyPrice = price info returned by the API
interface CanopyPrice {
  symbol: string;    // "$"
  value: number;     // 1299.99
  currency: string;  // "USD"
  display: string;   // "$1,299.99"
}

// CanopyProductResult = one product from Amazon search results
interface CanopyProductResult {
  title: string;           // Product title
  url: string;             // Amazon product URL
  asin: string;            // Amazon's product ID
  price: CanopyPrice;      // Price information
  mainImageUrl?: string;   // Product image
  rating?: number;         // Star rating (1-5)
  ratingsTotal?: number;   // Number of reviews
  isPrime?: boolean;       // Prime eligible?
  sponsored?: boolean;     // Is it a sponsored listing?
}

// CanopySearchResponse = the full response from Canopy's search endpoint
interface CanopySearchResponse {
  data: {
    amazonProductSearchResults: {
      productResults: {
        results: CanopyProductResult[];
      };
    };
  };
}

export type { CanopyProductResult };


/**
 * -----------------------------------------------------------------------------
 * CanopyClient
 * -----------------------------------------------------------------------------
 * A class that handles making requests to the Canopy API.
 * 
 * HOW TO USE:
 *   const client = new CanopyClient({ baseUrl: "...", apiKey: "..." });
 *   const results = await client.searchAmazon({ searchTerm: "gaming pc" });
 * -----------------------------------------------------------------------------
 */
export class CanopyClient {
  constructor(
    private readonly config: {
      baseUrl: string;           // Canopy API URL
      apiKey: string;            // Your API key
      authHeaderName?: string;   // Header name for auth (default: "Authorization")
    }
  ) {}

  /**
   * ---------------------------------------------------------------------------
   * searchAmazon()
   * ---------------------------------------------------------------------------
   * Searches Amazon for products matching the given search term.
   * 
   * INPUTS:
   *   - searchTerm: What to search for (e.g., "gaming desktop computer")
   *   - minPrice: Minimum price filter (optional)
   *   - maxPrice: Maximum price filter (optional)
   *   - limit: Max number of results to return (optional)
   * 
   * OUTPUTS:
   *   Array of CanopyProductResult objects (the products we found)
   * ---------------------------------------------------------------------------
   */
  async searchAmazon(params: {
    searchTerm: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  }): Promise<CanopyProductResult[]> {
    const { baseUrl, apiKey } = this.config;
    const authHeaderName = this.config.authHeaderName ?? "Authorization";

    // Build the URL with search parameters
    const url = new URL("/api/amazon/search", baseUrl);
    url.searchParams.set("searchTerm", params.searchTerm);
    if (params.minPrice != null) url.searchParams.set("minPrice", String(params.minPrice));
    if (params.maxPrice != null) url.searchParams.set("maxPrice", String(params.maxPrice));
    if (params.limit != null) url.searchParams.set("limit", String(params.limit));

    // Make the API request
    const res = await fetch(url.toString(), {
      headers: {
        [authHeaderName]: apiKey,
      },
      cache: "no-store",
    });

    // Check if request failed
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Canopy search failed: ${res.status} ${res.statusText} - ${text}`);
    }

    // Parse and return the results
    const json = (await res.json()) as CanopySearchResponse;
    return json.data.amazonProductSearchResults.productResults.results ?? [];
  }
}


/**
 * -----------------------------------------------------------------------------
 * getCanopyClientFromEnv()
 * -----------------------------------------------------------------------------
 * Creates a CanopyClient using the API key and URL from .env.local file.
 * Returns null if the environment variables aren't set.
 * 
 * INPUTS: None (reads from process.env)
 * 
 * OUTPUTS:
 *   - CanopyClient if configured
 *   - null if API key or URL is missing
 * -----------------------------------------------------------------------------
 */
export function getCanopyClientFromEnv(): CanopyClient | null {
  // Read settings from .env.local
  const apiKey = process.env.CANOPY_API_KEY;
  const baseUrl = process.env.CANOPY_BASE_URL;

  console.log("Canopy env check:", { hasApiKey: !!apiKey, hasBaseUrl: !!baseUrl });

  // Return null if not configured
  if (!apiKey || !baseUrl) return null;

  // Create and return the client
  return new CanopyClient({
    baseUrl,
    apiKey,
    authHeaderName: process.env.CANOPY_AUTH_HEADER_NAME,
  });
}

  return new CanopyClient({
    baseUrl,
    apiKey,
    authHeaderName: process.env.CANOPY_AUTH_HEADER_NAME,
  });
}
