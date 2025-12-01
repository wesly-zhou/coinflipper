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

    // Validate required parameters
    if (!fromToken || !toToken || !fromAmount) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromToken, toToken, fromAmount' },
        { status: 400 }
      );
    }

    // Validate fromAmount is a valid number (integer or decimal)
    if (!/^\d+(\.\d*)?$/.test(fromAmount) || parseFloat(fromAmount) <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid fromAmount',
          message: 'fromAmount must be a positive number (e.g., "4" or "1.5")',
        },
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

    const cdp = getCdpClient();

    // For price estimates, use zero address as taker (simulation only)
    // This doesn't require a real account
    const takerAddress = (taker || '0x0000000000000000000000000000000000000000') as Address;

    // Get swap price from CDP
    // Note: For price estimates, taker address is used for simulation only
    const swapPrice = await cdp.evm.getSwapPrice({
      fromToken: fromToken as Address,
      toToken: toToken as Address,
      fromAmount: BigInt(fromAmount),
      network,
      taker: takerAddress,
    });

    // Check if liquidity is available
    if (!swapPrice.liquidityAvailable) {
      return NextResponse.json({ error: 'No liquidity available for this swap' }, { status: 400 });
    }

    return NextResponse.json(swapPrice);
  } catch (error) {
    console.error('Error fetching swap price:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to fetch swap price',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
