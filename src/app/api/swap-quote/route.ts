/**
 * POST /api/swap-quote
 *
 * Creates a swap quote using CDP SDK with the user's wallet as taker.
 * Returns transaction data that the frontend can execute via the user's Privy wallet.
 *
 * Body:
 * {
 *   fromToken: string;         // Token address to swap from
 *   toToken: string;           // Token address to swap to
 *   fromAmount: string;        // Amount to swap in atomic units (BigInt string)
 *   network: string;           // "base" or "ethereum"
 *   taker: string;             // User's wallet address (from Privy)
 *   slippageBps?: number;      // Optional slippage in basis points (default 100 = 1%)
 * }
 *
 * Returns: SwapQuoteResponse (serializable CreateSwapQuoteResult without execute)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCdpClient } from '@/lib/cdp';
import { Address, SupportedNetwork, SwapQuoteResponse } from '@/types';
import { privy } from '@/lib/privy';
import { DEFAULT_NETWORK, DEFAULT_SLIPPAGE_BPS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Verify Privy auth token
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    try {
      await privy.utils().auth().verifyAuthToken(authToken);
    } catch {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      fromToken,
      toToken,
      fromAmount,
      taker,
      network = DEFAULT_NETWORK,
      slippageBps = DEFAULT_SLIPPAGE_BPS,
    } = body;

    // Validate required parameters
    if (!fromToken || !toToken || !fromAmount || !taker) {
      return NextResponse.json(
        {
          error: 'Missing required fields: fromToken, toToken, fromAmount, taker',
        },
        { status: 400 }
      );
    }

    // Validate fromAmount is a positive integer string (atomic units)
    if (!/^\d+$/.test(fromAmount) || fromAmount === '0') {
      return NextResponse.json(
        { error: 'Invalid fromAmount. Must be a positive integer string (atomic units).' },
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

    // Create swap quote using user's wallet address as taker
    const swapQuote = await cdp.evm.createSwapQuote({
      network: network as SupportedNetwork,
      fromToken: fromToken as Address,
      toToken: toToken as Address,
      fromAmount: BigInt(fromAmount),
      taker: taker as Address,
      slippageBps,
    });

    // Check if liquidity is available
    if (!swapQuote.liquidityAvailable) {
      return NextResponse.json({ error: 'No liquidity available for this swap' }, { status: 400 });
    }

    // Serialize BigInt values to strings for JSON compatibility
    const response: SwapQuoteResponse = {
      liquidityAvailable: swapQuote.liquidityAvailable,
      network: swapQuote.network as SupportedNetwork,
      fromToken: swapQuote.fromToken,
      toToken: swapQuote.toToken,
      fromAmount: swapQuote.fromAmount.toString(),
      toAmount: swapQuote.toAmount.toString(),
      minToAmount: swapQuote.minToAmount.toString(),
      blockNumber: swapQuote.blockNumber.toString(),
      fees: {
        ...(swapQuote.fees?.gasFee && {
          gasFee: {
            amount: swapQuote.fees.gasFee.amount.toString(),
            token: swapQuote.fees.gasFee.token,
          },
        }),
        ...(swapQuote.fees?.protocolFee && {
          protocolFee: {
            amount: swapQuote.fees.protocolFee.amount.toString(),
            token: swapQuote.fees.protocolFee.token,
          },
        }),
      },
      issues: {
        ...(swapQuote.issues?.allowance && {
          allowance: {
            currentAllowance: swapQuote.issues.allowance.currentAllowance.toString(),
            spender: swapQuote.issues.allowance.spender,
          },
        }),
        ...(swapQuote.issues?.balance && {
          balance: {
            token: swapQuote.issues.balance.token,
            currentBalance: swapQuote.issues.balance.currentBalance.toString(),
            requiredBalance: swapQuote.issues.balance.requiredBalance.toString(),
          },
        }),
        simulationIncomplete: swapQuote.issues.simulationIncomplete,
      },
      ...(swapQuote.transaction && {
        transaction: {
          to: swapQuote.transaction.to,
          data: swapQuote.transaction.data,
          value: swapQuote.transaction.value.toString(),
          gas: swapQuote.transaction.gas.toString(),
          gasPrice: swapQuote.transaction.gasPrice.toString(),
        },
      }),
      ...(swapQuote.permit2 && {
        permit2: swapQuote.permit2,
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating swap quote:', error);
    return NextResponse.json(
      {
        error: 'Failed to create swap quote',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
