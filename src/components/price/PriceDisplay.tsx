'use client';

import { Token, GetSwapPriceResult } from '@/types';
import {
  formatTokenAmount,
  calculateExchangeRate,
  calculatePriceImpact,
} from '@/lib/transformers';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PriceDisplayProps {
  price: GetSwapPriceResult | null;
  fromToken: Token | null;
  toToken: Token | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export default function PriceDisplay({
  price,
  fromToken,
  toToken,
  loading,
  error,
  lastUpdated,
}: PriceDisplayProps) {
  if (!fromToken || !toToken) {
    return null;
  }

  if (loading && !price) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <LoadingSpinner size="sm" />
          <span>Fetching price...</span>
        </div>
      </div>
    );
  }

  if (error && !price) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!price || !price.liquidityAvailable) {
    return null;
  }

  const exchangeRate = calculateExchangeRate(
    price.fromAmount,
    fromToken.decimals,
    price.toAmount,
    toToken.decimals
  );

  const priceImpact = calculatePriceImpact(price.toAmount, price.minToAmount);

  const timeSinceUpdate = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-3">
      {/* Exchange Rate */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">Exchange Rate</span>
        <span className="text-white font-medium">
          1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
        </span>
      </div>

      {/* Price Impact */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">Max Slippage</span>
        <span className={`font-medium ${priceImpact > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
          {priceImpact.toFixed(2)}%
        </span>
      </div>

      {/* Minimum Received */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">Minimum Received</span>
        <span className="text-white font-medium">
          {formatTokenAmount(price.minToAmount, toToken.decimals)} {toToken.symbol}
        </span>
      </div>

      {/* Gas Fee */}
      {price.fees?.gasFee && (
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Network Fee</span>
          <span className="text-slate-300">
            ~{formatTokenAmount(price.fees.gasFee.amount, 18, 6)} ETH
          </span>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <span className="text-slate-500 text-xs flex items-center gap-1">
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="text-slate-400" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Updated {timeSinceUpdate !== null ? `${timeSinceUpdate}s ago` : 'just now'}
              </span>
            </>
          )}
        </span>
      </div>

      {/* Issues Warning */}
      {price.issues?.simulationIncomplete && (
        <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 rounded-lg px-3 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Price estimate may be inaccurate</span>
        </div>
      )}
    </div>
  );
}