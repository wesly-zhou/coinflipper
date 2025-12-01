// CoinGecko API Client
// Demo API: https://api.coingecko.com/api/v3/
// Auth: x-cg-demo-api-key header

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

class CoinGeckoClient {
  private apiKey: string;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // 2 seconds between requests (30/min limit)

  constructor() {
    this.apiKey = process.env.COINGECKO_API_KEY || '';
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    await this.throttle();

    const url = new URL(`${COINGECKO_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey;
    }

    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CoinGecko API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get trending coins
  async getTrending(): Promise<import('@/types/coingecko').TrendingResponse> {
    return this.fetch('/search/trending');
  }
}

// Singleton instance
export const coingecko = new CoinGeckoClient();