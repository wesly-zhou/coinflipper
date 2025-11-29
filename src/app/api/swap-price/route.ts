/**
 * GET /api/swap-price
 *
 * Fetches a quick price estimate for a token swap.
 * Used for real-time price updates in the UI.
 *
 * Query Parameters:
 * - fromToken: Token address to swap from (0x...)
 * - toToken: Token address to swap to (0x...)
 * - fromAmount: Amount to swap (decimal string, e.g., "1.5")
 * - network: Network to use ("base" or "ethereum")
 * - fromDecimals: Token decimals for 'from' token (e.g., 18 for ETH)
 *
 * Returns: CDP SDK's getSwapPrice result
 */

import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';
import { formatAmountForCdp } from '@/lib/transformers';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        // Parse query parameters
        const fromToken = searchParams.get('fromToken');
        const toToken = searchParams.get('toToken');
        const fromAmount = searchParams.get('fromAmount');
        const network = searchParams.get('network') as 'base' | 'ethereum';
        const fromDecimals = searchParams.get('fromDecimals');

        // Validate required parameters
        if (!fromToken || !toToken || !fromAmount || !network || !fromDecimals) {
            return NextResponse.json(
                { error: 'Missing required parameters: fromToken, toToken, fromAmount, network, fromDecimals' },
                { status: 400 }
            );
        }

        // Validate network
        if (network !== 'base' && network !== 'ethereum') {
            return NextResponse.json(
                { error: 'Invalid network. Must be "base" or "ethereum"' },
                { status: 400 }
            );
        }

        // Initialize CDP SDK (reads API keys from env)
        const cdp = new CdpClient();

        // Convert amount to atomic units
        const decimals = parseInt(fromDecimals, 10);
        const fromAmountBigInt = formatAmountForCdp(fromAmount, decimals);

        // Get swap price from CDP
        // Note: For price estimates, taker address is used for simulation only
        const result = await cdp.evm.getSwapPrice({
            fromToken: fromToken as `0x${string}`,
            toToken: toToken as `0x${string}`,
            fromAmount: fromAmountBigInt,
            network,
            taker: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        });

        // Check if liquidity is available
        if (!result.liquidityAvailable) {
            return NextResponse.json(
                { error: 'No liquidity available for this swap' },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching swap price:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch swap price',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
