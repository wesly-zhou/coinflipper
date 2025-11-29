/**
 * POST /api/swap-quote
 *
 * Creates an executable swap quote using CDP accounts.
 * The quote object can be executed to perform the actual swap.
 *
 *
 * Body:
 * {
 *   fromToken: string;         // Token address to swap from
 *   toToken: string;           // Token address to swap to
 *   fromAmount: string;        // Amount to swap (decimal string) in atomic units
 *   network: string;           // "base" or "ethereum"
 *   fromDecimals: number;      // Token decimals for 'from' token
 *   slippageBps?: number;      // Optional slippage in basis points (default 100 = 1%)
 * }
 *
 * Returns: Executable swap quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';
import { formatAmountForCdp } from '@/lib/transformers';
import { privy } from "@/lib/privy";

export async function POST(request: NextRequest) {
    try {
        const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
          }

        let userId: string;
        try {
            const verifiedClaims = await privy.utils().auth().verifyAuthToken(authToken);
            userId = verifiedClaims.user_id;
        } catch (err) {
            return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { fromToken, toToken, fromAmount, network, fromDecimals, slippageBps = 100 } = body;

        // Validate required parameters
        if (!fromToken || !toToken || !fromAmount || !network || !fromDecimals) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: fromToken, toToken, fromAmount, network, fromDecimals',
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

        // Initialize CDP SDK
        const cdp = new CdpClient();
    
        // Get or create a hidden CDP smart account for this user
        const owner = await cdp.evm.getOrCreateAccount({ name: `User-${userId}` });
        const smartAccount = await cdp.evm.createSmartAccount({ owner });

        // Convert amount to atomic units
        const fromAmountBigInt = formatAmountForCdp(fromAmount, fromDecimals);

        // Create swap quote using CDP account
        // This returns an executable quote object
        const swapQuote = await smartAccount.quoteSwap({
            network: network as 'base' | 'ethereum',
            fromToken: fromToken as `0x${string}`,
            toToken: toToken as `0x${string}`,
            fromAmount: fromAmountBigInt,
            slippageBps,
        });

        // Check if liquidity is available
        if (!swapQuote.liquidityAvailable) {
            return NextResponse.json(
                { error: 'No liquidity available for this swap' },
                { status: 400 }
            );
        }

        // Return executable quote
        // Note: The quote object contains an execute() method that can be called
        // to perform the actual swap on-chain
        return NextResponse.json({
            quote: {
                liquidityAvailable: swapQuote.liquidityAvailable,
                fromToken: swapQuote.fromToken,
                toToken: swapQuote.toToken,
                fromAmount: swapQuote.fromAmount.toString(),
                toAmount: swapQuote.toAmount.toString(),
                minToAmount: swapQuote.minToAmount.toString(),
                blockNumber: swapQuote.blockNumber.toString(),
                fees: {
                    gasFee: swapQuote.fees.gasFee
                        ? {
                              amount: swapQuote.fees.gasFee.amount.toString(),
                              token: swapQuote.fees.gasFee.token,
                          }
                        : undefined,
                    protocolFee: swapQuote.fees.protocolFee
                        ? {
                              amount: swapQuote.fees.protocolFee.amount.toString(),
                              token: swapQuote.fees.protocolFee.token,
                          }
                        : undefined,
                },
                issues: swapQuote.issues,
            },
            accountAddress: smartAccount.address,
            timestamp: Date.now(),
            expiresAt: Date.now() + 30000, // Quote expires in 30 seconds
        });
    } catch (error) {
        console.error('Error creating swap quote:', error);
        return NextResponse.json(
            {
                error: 'Failed to create swap quote',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
