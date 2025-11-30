/**
 * GET /api/tokens
 *
 * Fetches tokens from Uniswap Token Lists (community-maintained)
 * Falls back to hardcoded list if fetch fails.
 *
 */

import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_TOKENS, SUPPORTED_NETWORKS, TOKEN_LIST_URLS } from '@/lib/constants';
import type { SupportedNetwork, Token, TokenListToken } from '@/types';


interface TokenListResponse {
    name: string;
    tokens: TokenListToken[];
}

/**
 * Fetch tokens from Uniswap-compatible token list
 */
async function fetchTokenList(network: 'base' | 'ethereum'): Promise<Token[]> {
    const url = TOKEN_LIST_URLS[network];
    const chainId = SUPPORTED_NETWORKS.find(n => n.id === network)?.chainId;

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

        console.log(`Fetched ${tokens.length} tokens for ${network} from CoinGecko token list`);
        return tokens;
    } catch (error) {
        console.error(`Failed to fetch ${network} token list:`, error);
        console.log(`Using fallback tokens for ${network}`);

        // Return fallback tokens for this network
        return FALLBACK_TOKENS[network];
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

            usingFallback = tokens.length === FALLBACK_TOKENS[network].length;
        } else {
            // Fetch both networks
            const [baseTokens, ethTokens] = await Promise.all([
                fetchTokenList('base'),
                fetchTokenList('ethereum'),
            ]);
            tokens = [...baseTokens, ...ethTokens];

            // Check if we're using all fallback tokens
            usingFallback = tokens.length === Object.values(FALLBACK_TOKENS).reduce((sum, arr) => sum + arr.length, 0);
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
            ? FALLBACK_TOKENS[network as SupportedNetwork]
            : Object.values(FALLBACK_TOKENS).flat();

        return NextResponse.json({
            tokens: fallbackTokens,
            count: fallbackTokens.length as number,
            source: 'fallback' as const,
            error: 'API error, using fallback tokens',
            network: network || 'all',
        });
    }
}
