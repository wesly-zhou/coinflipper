'use client';

import { useState, useEffect, useRef } from 'react';
import { Token } from '@/types';

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
  label?: string;
}

export default function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  excludeToken,
  label = 'Select token',
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter tokens based on search and exclude token
  const filteredTokens = tokens.filter(token => {
    if (excludeToken && token.address.toLowerCase() === excludeToken.address.toLowerCase()) {
      return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return token.symbol.toLowerCase().includes(query) || token.name.toLowerCase().includes(query);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 ${
          selectedToken
            ? 'bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626]'
            : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'
        }`}
      >
        {selectedToken ? (
          <>
            {selectedToken.logoUrl && (
              <img
                src={selectedToken.logoUrl}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="font-medium text-white">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="font-medium">{label}</span>
        )}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${selectedToken ? 'text-[#737373]' : 'text-white/80'} ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-[#1f1f1f]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#525252]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search token name or paste address"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] text-white placeholder-[#525252] rounded-xl border border-[#262626] focus:outline-none focus:border-[#333]"
                autoFocus
              />
            </div>
          </div>

          {/* Token list */}
          <div className="max-h-72 overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#525252]">No tokens found</div>
            ) : (
              filteredTokens.map(token => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A] transition-colors ${
                    selectedToken?.address === token.address ? 'bg-[#1A1A1A]' : ''
                  }`}
                >
                  {token.logoUrl ? (
                    <img
                      src={token.logoUrl}
                      alt={token.symbol}
                      className="w-9 h-9 rounded-full"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="%23333"/></svg>';
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{token.symbol[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-[#525252] truncate">{token.name}</div>
                  </div>
                  {selectedToken?.address === token.address && (
                    <svg className="w-5 h-5 text-[#00DC82]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
