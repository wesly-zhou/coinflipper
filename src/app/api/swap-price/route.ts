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
import { getCdpClient } from '@/lib/cdp';
import { formatAmountForCdp } from '@/lib/transformers';
import { DEFAULT_NETWORK } from '@/lib/constants';
import { Address, SupportedNetwork } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        // Parse query parameters
        const fromToken = searchParams.get('fromToken');
        const toToken = searchParams.get('toToken');
        const fromAmount = searchParams.get('fromAmount');
        const network = (searchParams.get('network') as SupportedNetwork) || DEFAULT_NETWORK;
        const taker = searchParams.get('taker');
        const fromDecimalsRaw = searchParams.get('fromDecimals');

        // Validate required parameters
        if (!fromToken || !toToken || !fromAmount || !fromDecimalsRaw) {
            return NextResponse.json(
                { error: 'Missing required parameters: fromToken, toToken, fromAmount, fromDecimals' },
                { status: 400 }
            );
        }

        const fromDecimals = Number(fromDecimalsRaw);
        let atomicFromAmount: bigint;
        try {
            atomicFromAmount = formatAmountForCdp(fromAmount, fromDecimals);
        } catch (err) {
            return NextResponse.json(
                { error: 'Invalid fromAmount', message: 'Could not parse decimal input' },
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

        // Validate fromAmount is a valid number
        if (!/^\d+$/.test(fromAmount)) {
            return NextResponse.json(
                { error: 'Invalid fromAmount', message: 'fromAmount must be a positive integer (atomic units)' },
                { status: 400 }
            );
        }

        const cdp = getCdpClient();
    
        // Get or create an account to use as the taker if not provided
        let takerAddress = taker;
        if (!takerAddress) {
            const account = await cdp.evm.getOrCreateAccount({ name: 'SwapPriceAccount' });
            takerAddress = account.address;
        }

        // Get swap price from CDP
        // Note: For price estimates, taker address is used for simulation only
        const result = await cdp.evm.getSwapPrice({
            fromToken: fromToken as Address,
            toToken: toToken as Address,
            fromAmount: atomicFromAmount,
            network,
            taker: takerAddress as Address,
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
