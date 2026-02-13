/**
 * /api/transactions
 *
 * POST - Record a new swap transaction
 * GET  - Fetch transaction history for a wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/transactions
 *
 * Records a swap transaction in the database.
 *
 * Body:
 * {
 *   walletAddress: string;   // User's wallet address
 *   fromToken: string;       // From token contract address
 *   toToken: string;         // To token contract address
 *   fromSymbol: string;      // From token symbol (e.g. "WETH")
 *   toSymbol: string;        // To token symbol (e.g. "USDC")
 *   fromAmount: string;      // Amount sent (human-readable)
 *   toAmount: string;        // Amount received (human-readable)
 *   txHash?: string;         // Transaction hash (if available)
 *   status?: string;         // "pending" | "completed" | "failed" (default: "pending")
 *   network: string;         // "base" or "ethereum"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      fromToken,
      toToken,
      fromSymbol,
      toSymbol,
      fromAmount,
      toAmount,
      txHash,
      status = 'pending',
      network,
    } = body;

    // Validate required fields
    if (
      !walletAddress ||
      !fromToken ||
      !toToken ||
      !fromSymbol ||
      !toSymbol ||
      !fromAmount ||
      !toAmount ||
      !network
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate status
    if (!['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "pending", "completed", or "failed"' },
        { status: 400 }
      );
    }

    const transaction = await prisma.swapTransaction.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        fromToken,
        toToken,
        fromSymbol,
        toSymbol,
        fromAmount,
        toAmount,
        txHash: txHash || null,
        status,
        network,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error recording transaction:', error);
    return NextResponse.json(
      {
        error: 'Failed to record transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions?wallet=0x...&limit=20&offset=0
 *
 * Fetches transaction history for a wallet address.
 * Results are ordered by creation date (newest first).
 *
 * Query params:
 *   wallet  - (required) The wallet address to fetch transactions for
 *   limit   - (optional) Number of results to return (default: 20, max: 100)
 *   offset  - (optional) Number of results to skip for pagination (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Missing required query parameter: wallet' },
        { status: 400 }
      );
    }

    const [transactions, total] = await Promise.all([
      prisma.swapTransaction.findMany({
        where: { walletAddress: wallet.toLowerCase() },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.swapTransaction.count({
        where: { walletAddress: wallet.toLowerCase() },
      }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/transactions
 *
 * Updates a transaction's status (e.g., pending → completed or failed).
 *
 * Body:
 * {
 *   txHash: string;     // The transaction hash to update
 *   status: string;     // New status: "completed" or "failed"
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, status } = body;

    if (!txHash || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: txHash, status' },
        { status: 400 }
      );
    }

    if (!['completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "completed" or "failed"' },
        { status: 400 }
      );
    }

    const transaction = await prisma.swapTransaction.update({
      where: { txHash },
      data: { status },
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    // Handle "record not found" from Prisma
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    console.error('Error updating transaction:', error);
    return NextResponse.json(
      {
        error: 'Failed to update transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
