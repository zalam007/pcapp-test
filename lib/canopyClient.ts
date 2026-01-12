interface CanopyPrice {
  symbol: string;
  value: number;
  currency: string;
  display: string;
}

interface CanopyProductResult {
  title: string;
  url: string;
  asin: string;
  price: CanopyPrice;
  mainImageUrl?: string;
  rating?: number;
  ratingsTotal?: number;
  isPrime?: boolean;
  sponsored?: boolean;
}

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

export class CanopyClient {
  constructor(
    private readonly config: {
      baseUrl: string;
      apiKey: string;
      authHeaderName?: string;
    }
  ) {}

  async searchAmazon(params: {
    searchTerm: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  }): Promise<CanopyProductResult[]> {
    const { baseUrl, apiKey } = this.config;
    const authHeaderName = this.config.authHeaderName ?? "Authorization";

    const url = new URL("/api/amazon/search", baseUrl);
    url.searchParams.set("searchTerm", params.searchTerm);
    if (params.minPrice != null) url.searchParams.set("minPrice", String(params.minPrice));
    if (params.maxPrice != null) url.searchParams.set("maxPrice", String(params.maxPrice));
    if (params.limit != null) url.searchParams.set("limit", String(params.limit));

    const res = await fetch(url.toString(), {
      headers: {
        [authHeaderName]: apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Canopy search failed: ${res.status} ${res.statusText} - ${text}`);
    }

    const json = (await res.json()) as CanopySearchResponse;
    return json.data.amazonProductSearchResults.productResults.results ?? [];
  }
}

export function getCanopyClientFromEnv(): CanopyClient | null {
  const apiKey = process.env.CANOPY_API_KEY;
  const baseUrl = process.env.CANOPY_BASE_URL;

  console.log("Canopy env check:", { hasApiKey: !!apiKey, hasBaseUrl: !!baseUrl });

  if (!apiKey || !baseUrl) return null;

  return new CanopyClient({
    baseUrl,
    apiKey,
    authHeaderName: process.env.CANOPY_AUTH_HEADER_NAME,
  });
}
