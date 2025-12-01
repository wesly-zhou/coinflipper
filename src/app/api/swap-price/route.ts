/**
 * GET /api/swap-price
 *
 * Fetches a quick price estimate for a token swap.
 * Used for real-time price updates in the UI.
 *
 * Query Parameters:
 * - fromToken: Token address to swap from (0x...)
 * - toToken: Token address to swap to (0x...)
 * - fromAmount: Amount to swap in atomic units (BigInt string, e.g., "1000000000000000000" for 1 ETH)
 * - network: Network to use ("base" or "ethereum")
 * - taker: Taker address to use for simulation only (optional)
 *
 * Returns: CDP SDK's getSwapPrice result
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCdpClient } from '@/lib/cdp';
import { DEFAULT_NETWORK } from '@/lib/constants';
import { Address, SupportedNetwork, GetSwapPriceResult } from '@/types';

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

    // Validate fromAmount - it should be a BigInt string (atomic units)
    // e.g., "1000000000000000000" for 1 ETH (18 decimals)
    if (!/^\d+$/.test(fromAmount)) {
      return NextResponse.json(
        {
          error: 'Invalid fromAmount',
          message: 'fromAmount must be a positive integer (atomic units)',
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

    // Using a well-known address (Uniswap V3 Router) as a placeholder address for price estimates
    const defaultTakerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // Uniswap V3 Router
    const takerAddress = (taker || defaultTakerAddress) as Address;

    // Get swap price from CDP
    // Note: For price estimates, taker address is used for simulation only
    try {
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

      // Convert BigInt values to strings for JSON serialization
      const response: GetSwapPriceResult = {
        liquidityAvailable: swapPrice.liquidityAvailable,
        fromToken: swapPrice.fromToken,
        toToken: swapPrice.toToken,
        fromAmount: swapPrice.fromAmount.toString(),
        toAmount: swapPrice.toAmount.toString(),
        minToAmount: swapPrice.minToAmount.toString(),
        blockNumber: swapPrice.blockNumber.toString(),
        fees: {
          ...(swapPrice.fees?.gasFee && {
            gasFee: {
              amount: swapPrice.fees.gasFee.amount.toString(),
              token: swapPrice.fees.gasFee.token,
            },
          }),
          ...(swapPrice.fees?.protocolFee && {
            protocolFee: {
              amount: swapPrice.fees.protocolFee.amount.toString(),
              token: swapPrice.fees.protocolFee.token,
            },
          }),
        },
        issues: {
          ...(swapPrice.issues?.allowance && {
            allowance: {
              currentAllowance: swapPrice.issues.allowance.currentAllowance.toString(),
              spender: swapPrice.issues.allowance.spender,
            },
          }),
          ...(swapPrice.issues?.balance && {
            balance: {
              token: swapPrice.issues.balance.token,
              currentBalance: swapPrice.issues.balance.currentBalance.toString(),
              requiredBalance: swapPrice.issues.balance.requiredBalance.toString(),
            },
          }),
          simulationIncomplete: swapPrice.issues.simulationIncomplete,
        },
        ...(swapPrice.gas && { gas: swapPrice.gas.toString() }),
        ...(swapPrice.gasPrice && { gasPrice: swapPrice.gasPrice.toString() }),
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error fetching swap price:', error);
      return NextResponse.json(
        { error: 'Failed to fetch swap price', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
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
