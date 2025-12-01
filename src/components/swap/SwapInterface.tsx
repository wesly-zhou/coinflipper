'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Token, SupportedNetwork } from '@/types';
import { useTokens } from '@/hooks/useTokens';
import { useSwapPrice } from '@/hooks/useSwapPrice';
import { formatAmountForCdp, formatTokenAmount } from '@/lib/transformers';
import { DEFAULT_NETWORK } from '@/lib/constants';
import TokenSelector from './TokenSelector';
import PriceDisplay from '@/components/price/PriceDisplay';
import { Button } from '@/components/ui';
import { Address } from '@/types';

interface SwapInterfaceProps {
  initialToToken?: Token | null;
}

export default function SwapInterface({ initialToToken = null }: SwapInterfaceProps) {
  const [network, setNetwork] = useState<SupportedNetwork>(DEFAULT_NETWORK);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(initialToToken);
  const [fromAmount, setFromAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const { tokens, loading: tokensLoading } = useTokens(network);

  // Update toToken when initialToToken changes
  useEffect(() => {
    if (initialToToken) {
      setToToken(initialToToken);
      // Also update network if token is from a different network
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
      return bigIntAmount.toString(); // Convert BigInt to string for API
    } catch {
      return '0';
    }
  }, [fromAmount, fromToken]);

  // Get swap price
  const {
    price,
    loading: priceLoading,
    error: priceError,
    lastUpdated,
  } = useSwapPrice({
    fromToken: fromToken?.address as Address || null,
    toToken: toToken?.address as Address || null,
    fromAmount: fromAmountAtomic as string,
    network,
    enabled: !!fromToken && !!toToken && !!fromAmount && parseFloat(fromAmount) > 0 && fromAmountAtomic !== '0',
  });

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
  const handleFromAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
    }
  }, []);

  // Handle swap execution
  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmountAtomic || fromAmountAtomic === '0') return;

    setIsSwapping(true);
    try {
      // Create a swap quote
      const response = await fetch('/api/swap-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: fromAmountAtomic,
          network,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create swap quote');
      }

      const quote = await response.json();

      if (!quote.liquidityAvailable) {
        throw new Error('Insufficient liquidity');
      }

      // In a real app, you would execute the swap here
      alert(`Swap quote created successfully!\n\nYou would receive: ${formatTokenAmount(quote.toAmount, toToken.decimals)} ${toToken.symbol}\n\nNote: Swap execution requires wallet integration.`);
    } catch (error: unknown) {
      console.error('Swap error:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const canSwap = 
    fromToken && 
    toToken && 
    fromAmount && 
    parseFloat(fromAmount) > 0 && 
    price?.liquidityAvailable && 
    !priceLoading &&
    !isSwapping;

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

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="w-12 h-12 bg-[#1A1A1A] hover:bg-[#262626] border-4 border-[#141414] rounded-xl flex items-center justify-center transition-all duration-200 hover:rotate-180"
            disabled={!fromToken || !toToken}
          >
            <svg className="w-5 h-5 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token Input */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#262626]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#737373]">To</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-medium flex-1 text-[#525252] tracking-tight">
              {priceLoading ? (
                <span className="inline-block w-6 h-6 border-2 border-[#00DC82]/30 border-t-[#00DC82] rounded-full animate-spin" />
              ) : (
                toAmount || '0.0'
              )}
            </div>
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

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!canSwap}
          loading={isSwapping}
          className="w-full mt-5"
          size="lg"
        >
          {!fromToken || !toToken
            ? 'Select tokens'
            : !fromAmount || parseFloat(fromAmount) === 0
            ? 'Enter amount'
            : priceLoading
            ? 'Loading price...'
            : priceError
            ? 'Price unavailable'
            : !price?.liquidityAvailable
            ? 'Insufficient liquidity'
            : 'Swap'}
        </Button>

        {/* Powered by badge */}
        <div className="mt-5 text-center">
          <span className="text-[#525252] text-xs">
            Powered by Coinbase Trade API
          </span>
        </div>
      </div>
    </div>
  );
}