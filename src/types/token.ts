export interface Token {
    // Core identification
    id: string;
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    network: 'base' | 'ethereum';

    // Display/Trading data (optional)
    price?: number;
    change24h?: number;
    logoUrl?: string;
}
