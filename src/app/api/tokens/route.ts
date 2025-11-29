/**
 * GET /api/tokens
 *
 * Fetches tokens from Uniswap Token Lists (community-maintained)
 * Falls back to hardcoded list if fetch fails.
 *
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Token } from '@/types';

// Token list URLs (CoinGecko)
const TOKEN_LIST_URLS = {
    base: 'https://tokens.coingecko.com/base/all.json',
    ethereum: 'https://tokens.coingecko.com/ethereum/all.json',
} as const;

const CHAIN_IDS = {
    base: 8453,
    ethereum: 1,
} as const;

// Fallback tokens in case CoinGecko API is down
const FALLBACK_TOKENS: Token[] = [
    // Base Network
    {
        id: 'base-eth',
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        network: 'base',
        logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    },
    {
        id: 'base-usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        network: 'base',
        logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    },
    {
        id: 'base-dai',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
        decimals: 18,
        network: 'base',
        logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    },
    {
        id: 'base-usdt',
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
        decimals: 6,
        network: 'base',
        logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    },
    // Ethereum Network
    {
        id: 'ethereum-eth',
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        network: 'ethereum',
        logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    },
    {
        id: 'ethereum-usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        network: 'ethereum',
        logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    },
    {
        id: 'ethereum-usdt',
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        network: 'ethereum',
        logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    },
    {
        id: 'ethereum-dai',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        network: 'ethereum',
        logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    },
];

// CoinGecko token list response types
interface TokenListToken {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
}

interface TokenListResponse {
    name: string;
    tokens: TokenListToken[];
}

/**
 * Fetch tokens from Uniswap-compatible token list
 */
async function fetchTokenList(network: 'base' | 'ethereum'): Promise<Token[]> {
    const url = TOKEN_LIST_URLS[network];
    const chainId = CHAIN_IDS[network];

    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache for 1 hour
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: TokenListResponse = await response.json();

        // Filter by chain ID and map to Token type
        const tokens = data.tokens
            .filter(token => token.chainId === chainId)
            .map(token => ({
                id: `${network}-${token.symbol.toLowerCase()}-${token.address.slice(0, 6)}`,
                symbol: token.symbol,
                name: token.name,
                address: token.address,
                decimals: token.decimals,
                network,
                logoUrl: token.logoURI,
            }));

        console.log('Fetched ${tokens.length} tokens for ${network} from CoinGecko token list');
        return tokens;
    } catch (error) {
        console.error('Failed to fetch ${network} token list:', error);
        console.log('Using fallback tokens for ${network}');

        // Return fallback tokens for this network
        return FALLBACK_TOKENS.filter(token => token.network === network);
    }
}

/**
 * Main route handler
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const network = searchParams.get('network') as 'base' | 'ethereum' | null;

        // Validate network parameter
        if (network && network !== 'base' && network !== 'ethereum') {
            return NextResponse.json(
                { error: 'Invalid network. Must be "base" or "ethereum"' },
                { status: 400 }
            );
        }

        let tokens: Token[];
        let usingFallback = false;

        if (network) {
            // Fetch specific network
            tokens = await fetchTokenList(network);
            usingFallback = tokens.length > 0 && tokens.every(t => FALLBACK_TOKENS.includes(t));
        } else {
            // Fetch both networks
            const [baseTokens, ethTokens] = await Promise.all([
                fetchTokenList('base'),
                fetchTokenList('ethereum'),
            ]);
            tokens = [...baseTokens, ...ethTokens];

            // Check if we're using all fallback tokens
            const allFallback = tokens.every(t => FALLBACK_TOKENS.some(fb => fb.id === t.id));
            usingFallback = allFallback && tokens.length === FALLBACK_TOKENS.length;
        }

        return NextResponse.json({
            tokens,
            count: tokens.length,
            source: usingFallback ? 'fallback' : 'coingecko-token-list',
            cached: !usingFallback,
            network: network || 'all',
        });
    } catch (error) {
        console.error('Error in tokens route:', error);

        // Get network from params to filter fallback tokens
        const network = request.nextUrl.searchParams.get('network') as 'base' | 'ethereum' | null;
        const fallbackTokens = network
            ? FALLBACK_TOKENS.filter(t => t.network === network)
            : FALLBACK_TOKENS;

        return NextResponse.json({
            tokens: fallbackTokens,
            count: fallbackTokens.length,
            source: 'fallback',
            error: 'API error, using fallback tokens',
            network: network || 'all',
        });
    }
}
