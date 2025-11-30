'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Address, GetSwapPriceResult, SupportedNetwork } from '@/types';
import { useDebounce } from './useDebounce';
import { DEBOUNCE_DELAY, PRICE_REFRESH_INTERVAL } from '@/lib/constants';
import { useTokens } from '@/hooks/useTokens';

interface UseSwapPriceParams {
  fromToken: Address | null;
  toToken: Address | null;
  fromAmount: string;
  network: SupportedNetwork;
  enabled?: boolean;
}

interface UseSwapPriceResult {
  price: GetSwapPriceResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useSwapPrice({
  fromToken,
  toToken,
  fromAmount,
  network,
  enabled = true,
}: UseSwapPriceParams): UseSwapPriceResult {
  const { getTokenByAddress } = useTokens(network);

  const [price, setPrice] = useState<GetSwapPriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the fromAmount to prevent excessive API calls
  const debouncedFromAmount = useDebounce(fromAmount, DEBOUNCE_DELAY);

  const fetchPrice = useCallback(async () => {
    // Validate inputs
    if (!fromToken || !toToken || !debouncedFromAmount || debouncedFromAmount === '0') {
      setPrice(null);
      setError(null);
      return;
    }

    // Don't fetch if same tokens
    if (fromToken.toLowerCase() === toToken.toLowerCase()) {
      setPrice(null);
      setError('Cannot swap same token');
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const fromMetadata = getTokenByAddress(fromToken);

    if (!fromMetadata) {
      setError('Invalid from token address');
      setPrice(null);
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        fromToken,
        toToken,
        fromAmount: debouncedFromAmount,
        network,
        fromDecimals: String(fromMetadata.decimals),
      });

      const response = await fetch(`/api/swap-price?${params}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch price');
      }

      const data: GetSwapPriceResult = await response.json();
      setPrice(data);
      setLastUpdated(new Date());

      if (!data.liquidityAvailable) {
        setError('Insufficient liquidity for this swap');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Error fetching swap price:', err);
      setError(err.message || 'Failed to fetch price');
      setPrice(null);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, debouncedFromAmount, network, getTokenByAddress]);

  // Fetch price when inputs change
  useEffect(() => {
    if (enabled) {
      fetchPrice();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPrice, enabled]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (enabled && fromToken && toToken && debouncedFromAmount && debouncedFromAmount !== '0') {
      intervalRef.current = setInterval(() => fetchPrice(), PRICE_REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchPrice, enabled, fromToken, toToken, debouncedFromAmount]);

  const refetch = useCallback(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    loading,
    error,
    refetch,
    lastUpdated,
  };
}
