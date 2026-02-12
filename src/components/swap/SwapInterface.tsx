'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePrivy, useWallets, useLogin } from '@privy-io/react-auth';
import { Token, SupportedNetwork, SwapQuoteResponse } from '@/types';
import { useTokens } from '@/hooks/useTokens';
import { useSwapPrice } from '@/hooks/useSwapPrice';
import { formatAmountForCdp, formatTokenAmount, encodeApproveCalldata } from '@/lib/transformers';
import { DEFAULT_NETWORK } from '@/lib/constants';
import TokenSelector from './TokenSelector';
import PriceDisplay from '@/components/price/PriceDisplay';
import { Button } from '@/components/ui';
import { Address } from '@/types';

// Helper to convert a decimal string (atomic units) to hex for eth_sendTransaction
function toHex(value: string): string {
  return '0x' + BigInt(value).toString(16);
}

// Poll for transaction receipt until confirmed or timeout
async function waitForTransaction(
  provider: any,
  txHash: string,
  maxAttempts = 60
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    });
    if (receipt) {
      if (receipt.status === '0x0') {
        throw new Error('Transaction reverted on-chain');
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Transaction confirmation timed out');
}

interface SwapInterfaceProps {
  initialToToken?: Token | null;
}

export default function SwapInterface({ initialToToken = null }: SwapInterfaceProps) {
  const { authenticated, getAccessToken } = usePrivy();
  const { login } = useLogin();
  const { wallets } = useWallets();
  const primaryWallet = wallets[0];

  const [network, setNetwork] = useState<SupportedNetwork>(DEFAULT_NETWORK);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(initialToToken);
  const [fromAmount, setFromAmount] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [busyText, setBusyText] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const { tokens, loading: tokensLoading } = useTokens(network);

  // Update toToken when initialToToken changes
  useEffect(() => {
    if (initialToToken) {
      setToToken(initialToToken);
      if (initialToToken.network !== network) {
        setNetwork(initialToToken.network);
      }
    }
  }, [initialToToken, network]);

  // Convert human-readable amount to atomic units for API
  const fromAmountAtomic = useMemo(() => {
    if (!fromAmount || !fromToken) return '0';
    try {
      const bigIntAmount = formatAmountForCdp(fromAmount, fromToken.decimals);
      return bigIntAmount.toString();
    } catch {
      return '0';
    }
  }, [fromAmount, fromToken]);

  // Get swap price -- pass taker for accurate balance/allowance checks
  const {
    price,
    loading: priceLoading,
    error: priceError,
    lastUpdated,
    refetch,
  } = useSwapPrice({
    fromToken: (fromToken?.address as Address) || null,
    toToken: (toToken?.address as Address) || null,
    fromAmount: fromAmountAtomic as string,
    network,
    taker: (primaryWallet?.address as Address) || null,
    enabled:
      !!fromToken &&
      !!toToken &&
      !!fromAmount &&
      parseFloat(fromAmount) > 0 &&
      fromAmountAtomic !== '0',
  });

  // Derive issue flags from the price response
  const hasBalanceIssue = !!price?.issues?.balance;
  const needsApproval = !!price?.issues?.allowance;

  // Calculate the "to" amount to display
  const toAmount = useMemo(() => {
    if (!price?.liquidityAvailable || !toToken) return '';
    return formatTokenAmount(price.toAmount, toToken.decimals);
  }, [price, toToken]);

  // Handle swapping the from/to tokens
  const handleSwapTokens = useCallback(() => {
    const tempToken = fromToken;
    const tempAmount = toAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(tempAmount);
  }, [fromToken, toToken, toAmount]);

  // Handle from amount change with input validation
  const handleFromAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFromAmount(value);
        setTxHash(null);
      }
    },
    []
  );

  // Ensure wallet is on the correct chain
  const ensureCorrectChain = async (provider: any) => {
    const chainIdHex = network === 'base' ? '0x2105' : '0x1';
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error(
          `Please add the ${network === 'base' ? 'Base' : 'Ethereum'} network to your wallet.`
        );
      }
      if (error.code === 4001) {
        throw new Error('Network switch rejected. Please switch manually.');
      }
      throw error;
    }
  };

  // Full swap flow: approve (if needed) → get quote → send transaction → confirm
  const handlePlaceOrder = async () => {
    if (!fromToken || !toToken || !fromAmountAtomic || fromAmountAtomic === '0') return;
    if (!authenticated || !primaryWallet) return;
    if (!price?.liquidityAvailable) return;

    setIsBusy(true);
    setTxHash(null);
    try {
      const provider = await primaryWallet.getEthereumProvider();
      await ensureCorrectChain(provider);

      // Step 1: Approve if needed (with exact amount)
      if (needsApproval && price?.issues?.allowance) {
        setBusyText('Approving...');

        const spender = price.issues.allowance.spender;
        const approveData = encodeApproveCalldata(spender, fromAmountAtomic);

        const approveTxHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: primaryWallet.address,
              to: fromToken.address,
              data: approveData,
              value: '0x0',
            },
          ],
        });

        await waitForTransaction(provider, approveTxHash);
      }

      // Step 2: Get a swap quote
      setBusyText('Getting quote...');

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token. Please reconnect your wallet.');
      }

      const response = await fetch('/api/swap-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: fromAmountAtomic,
          taker: primaryWallet.address,
          network,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create swap quote');
      }

      const quote: SwapQuoteResponse = await response.json();

      if (!quote.liquidityAvailable) {
        throw new Error('Insufficient liquidity');
      }

      if (!quote.transaction) {
        throw new Error('No transaction data returned in quote.');
      }

      // Step 3: Handle permit2 if required (gasless signature)
      if (quote.permit2) {
        await provider.request({
          method: 'eth_signTypedData_v4',
          params: [primaryWallet.address, JSON.stringify(quote.permit2.eip712)],
        });
      }

      // Step 4: Send the swap transaction -- wallet shows estimated asset changes
      setBusyText('Confirm in wallet...');

      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: primaryWallet.address,
            to: quote.transaction.to,
            data: quote.transaction.data,
            value: toHex(quote.transaction.value),
            gas: toHex(quote.transaction.gas),
            gasPrice: toHex(quote.transaction.gasPrice),
          },
        ],
      });

      setTxHash(hash);

      // Step 5: Wait for on-chain confirmation
      setBusyText('Confirming...');
      await waitForTransaction(provider, hash);

      // Success -- reset form
      setFromAmount('');
      refetch();
    } catch (error: any) {
      console.error('Swap error:', error);
      if (error.code !== 4001) {
        alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsBusy(false);
      setBusyText('');
    }
  };

  // Determine button text and state
  const getButtonConfig = () => {
    if (!fromToken || !toToken) return { text: 'Select tokens', disabled: true };
    if (!fromAmount || parseFloat(fromAmount) === 0)
      return { text: 'Enter amount', disabled: true };
    if (priceLoading) return { text: 'Loading price...', disabled: true };
    if (priceError) return { text: 'Price unavailable', disabled: true };
    if (!price?.liquidityAvailable) return { text: 'Insufficient liquidity', disabled: true };
    if (hasBalanceIssue)
      return { text: `Insufficient ${fromToken.symbol} balance`, disabled: true };
    return { text: 'Place order', disabled: false };
  };

  const buttonConfig = getButtonConfig();

  // Block explorer URL for transaction hash
  const explorerUrl = txHash
    ? network === 'base'
      ? `https://basescan.org/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`
    : null;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Swap</h2>
        </div>

        {/* From Token Input */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#262626] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#737373]">From</span>
          </div>
          <div className="flex items-center gap-4 min-w-0">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={fromAmount}
              onChange={handleFromAmountChange}
              className="text-4xl font-medium flex-1 min-w-0 bg-transparent text-white placeholder-[#262626] focus:outline-none tracking-tight"
            />
            <div className="flex-shrink-0">
              <TokenSelector
                selectedToken={fromToken}
                onSelect={(token) => {
                  setFromToken(token);
                  if (token.network !== network) {
                    setNetwork(token.network);
                  }
                }}
                excludeToken={toToken}
                label="Select"
                network={network}
              />
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="w-12 h-12 bg-[#1A1A1A] hover:bg-[#262626] border-4 border-[#141414] rounded-xl flex items-center justify-center transition-all duration-200 hover:rotate-180 cursor-pointer"
            disabled={!fromToken || !toToken}
          >
            <svg
              className="w-5 h-5 text-[#737373]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To Token Input */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#262626] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#737373]">To</span>
          </div>
          <div className="flex items-center gap-4 min-w-0">
            <div className="text-4xl font-medium flex-1 min-w-0 text-[#525252] tracking-tight truncate">
              {priceLoading ? (
                <span className="inline-block w-6 h-6 border-2 border-[#00DC82]/30 border-t-[#00DC82] rounded-full animate-spin" />
              ) : (
                toAmount || '0.0'
              )}
            </div>
            <div className="flex-shrink-0">
              <TokenSelector
                selectedToken={toToken}
                onSelect={(token) => {
                  setToToken(token);
                  if (token.network !== network) {
                    setNetwork(token.network);
                  }
                }}
                excludeToken={fromToken}
                label="Select"
                network={network}
              />
            </div>
          </div>
        </div>

        {/* Price Display */}
        <div className="mt-5">
          <PriceDisplay
            price={price}
            fromToken={fromToken}
            toToken={toToken}
            loading={priceLoading}
            error={priceError}
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Place Order / Connect Wallet Button */}
        {!authenticated || !primaryWallet ? (
          <button
            onClick={login}
            className="w-full mt-5 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-base font-medium transition-colors cursor-pointer"
          >
            Connect Wallet to Swap
          </button>
        ) : (
          <Button
            onClick={handlePlaceOrder}
            disabled={buttonConfig.disabled || isBusy}
            loading={isBusy}
            className="w-full mt-5 cursor-pointer"
            size="lg"
          >
            {isBusy ? busyText : buttonConfig.text}
          </Button>
        )}

        {/* Transaction Success Banner */}
        {txHash && explorerUrl && (
          <div className="mt-4 p-3 bg-[#00DC82]/10 border border-[#00DC82]/20 rounded-xl">
            <p className="text-sm text-[#00DC82] font-medium mb-1">Swap submitted!</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00DC82]/70 hover:text-[#00DC82] underline break-all cursor-pointer"
            >
              View on {network === 'base' ? 'Basescan' : 'Etherscan'} →
            </a>
          </div>
        )}

        {/* Powered by badge */}
        <div className="mt-5 text-center">
          <span className="text-[#525252] text-xs">Powered by Coinbase Trade API</span>
        </div>
      </div>
    </div>
  );
}
