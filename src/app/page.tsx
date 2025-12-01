'use client';

import { useState } from 'react';
import SwapInterface from '@/components/swap/SwapInterface';
import TokenSelector from '@/components/swap/TokenSelector';
import { Token } from '@/types';
import { DEFAULT_NETWORK } from '@/lib/constants';

export default function Home() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D] via-[#0D0D0D] to-[#141414]" />
        
        {/* Flowing lines */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <svg preserveAspectRatio="none" viewBox="0 0 1440 400" className="w-full h-full">
            <defs>
              <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="30%" stopColor="#00DC82" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#00DC82" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="40%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path 
              d="M-100,200 Q300,150 600,200 T1200,180 T1800,200" 
              stroke="url(#lineGrad1)" 
              strokeWidth="2" 
              fill="none" 
              className="animate-pulse"
            />
            <path 
              d="M-100,220 Q400,180 700,220 T1300,200 T1900,220" 
              stroke="url(#lineGrad2)" 
              strokeWidth="1.5" 
              fill="none" 
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-semibold mb-4 tracking-tight">
            <span className="text-white">Swap any token </span>
            <span className="text-[#525252]">in seconds</span>
          </h1>
          <p className="text-[#737373] text-lg mb-8">
            Trade tokens across Base and Ethereum networks
          </p>
          
          {/* Search Bar - Only show when no token is selected */}
          {!selectedToken && (
            <div className="max-w-xl mx-auto">
              <TokenSelector
                selectedToken={null}
                onSelect={setSelectedToken}
                variant="search"
                network={DEFAULT_NETWORK}
              />
            </div>
          )}
        </div>
      </section>

      {/* Swap Interface - Only show when a token is selected */}
      {selectedToken && (
        <section id="swap-interface" className="max-w-[600px] mx-auto px-6 pb-20">
          <SwapInterface initialToToken={selectedToken} />
        </section>
      )}
    </div>
  );
}
