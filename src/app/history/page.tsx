'use client';

import { usePrivy } from '@privy-io/react-auth';
import TradeHistory from '@/components/trade/TradeHistory';

export default function HistoryPage() {
  const { authenticated, ready } = usePrivy();

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {!ready ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-[#00DC82]/30 border-t-[#00DC82] rounded-full animate-spin" />
          </div>
        ) : !authenticated ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <svg className="w-16 h-16 text-[#262626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-[#525252] text-lg">Connect your wallet to view trade history</p>
          </div>
        ) : (
          <TradeHistory />
        )}
      </div>
    </div>
  );
}
