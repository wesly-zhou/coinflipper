'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Token, SupportedNetwork } from '@/types';
import { DEFAULT_NETWORK, POPULAR_TOKENS, SUPPORTED_NETWORKS, NETWORK_LOGOS } from '@/lib/constants';
import { shortenAddress } from '@/lib/transformers';
import type { TrendingResponse } from '@/types/coingecko';

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
  label?: string;
  network?: SupportedNetwork;
  // For search bar usage (no button, just modal)
  variant?: 'button' | 'search';
  onOpen?: () => void;
}

type NetworkFilter = SupportedNetwork | 'all';

export default function TokenSelector({
  selectedToken,
  onSelect,
  excludeToken = null,
  label = 'Select token',
  network = DEFAULT_NETWORK,
  variant = 'button',
  onOpen,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('all');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingSymbols, setTrendingSymbols] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch trending coins
  useEffect(() => {
    if (!isOpen) return;

    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/coingecko/trending');
        if (response.ok) {
          const data: TrendingResponse = await response.json();
          // Extract symbols from trending coins (uppercase for matching)
          const symbols = data.coins.map(coin => coin.item.symbol.toUpperCase());
          setTrendingSymbols(symbols);
        }
      } catch (error) {
        console.error('Error fetching trending coins:', error);
        setTrendingSymbols([]);
      }
    };

    fetchTrending();
  }, [isOpen]);

  // Fetch tokens from selected network(s)
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const networksToFetch: SupportedNetwork[] =
      networkFilter === 'all' ? ['base', 'ethereum'] : [networkFilter];

    const fetchTokens = async () => {
      try {
        const fetchPromises = networksToFetch.map(net =>
          fetch(`/api/tokens?network=${net}`).then(res => res.json())
        );

        const results = await Promise.all(fetchPromises);
        const allTokens = results.flatMap((result: { tokens: Token[] }) => result.tokens);
        setTokens(allTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [isOpen, networkFilter]);

  // Get trending tokens by matching symbols
  const trendingTokens = useMemo(() => {
    if (trendingSymbols.length === 0) return [];

    return tokens
      .filter(token => {
        // Exclude the excludeToken
        if (excludeToken && token.address.toLowerCase() === excludeToken.address.toLowerCase()) {
          return false;
        }
        // Match by symbol (case-insensitive)
        return trendingSymbols.includes(token.symbol.toUpperCase());
      })
      .sort((a, b) => {
        // Sort by trending order (earlier in trending list = higher priority)
        const aIndex = trendingSymbols.indexOf(a.symbol.toUpperCase());
        const bIndex = trendingSymbols.indexOf(b.symbol.toUpperCase());
        return aIndex - bIndex;
      })
  }, [tokens, trendingSymbols, excludeToken]);

  // Get popular tokens based on network filter
  const popularTokens = useMemo(() => {
    // When "All" is selected, only show Ethereum tokens
    const popularTokenList = networkFilter === 'all'
      ? POPULAR_TOKENS.ethereum
      : POPULAR_TOKENS[networkFilter] || [];

    const popularAddresses = popularTokenList.map(t => t.address.toLowerCase());

    return tokens
      .filter(token => {
        // Exclude the excludeToken
    if (excludeToken && token.address.toLowerCase() === excludeToken.address.toLowerCase()) {
      return false;
    }
        if (networkFilter !== 'all' && token.network !== networkFilter) {
          return false;
        }
        // Exclude tokens that are already in trending
        const isTrending = trendingSymbols.includes(token.symbol.toUpperCase());
        if (isTrending) return false;
        return popularAddresses.includes(token.address.toLowerCase());
      })
      .sort((a, b) => {
        const aIndex = popularAddresses.indexOf(a.address.toLowerCase());
        const bIndex = popularAddresses.indexOf(b.address.toLowerCase());
        return aIndex - bIndex;
      });
  }, [tokens, networkFilter, excludeToken, trendingSymbols]);

  // Sort and filter tokens (excluding popular ones from main list if not searching)
  const sortedAndFilteredTokens = useMemo(() => {
    let filtered = tokens;

    // Exclude the excludeToken if provided
    if (excludeToken) {
      filtered = filtered.filter(
        token => token.address.toLowerCase() !== excludeToken.address.toLowerCase()
      );
    }

    // Apply network filter if not 'all'
    if (networkFilter !== 'all') {
      filtered = filtered.filter(token => token.network === networkFilter);
    }

    // Apply search filter
    if (searchQuery) {
    const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        token =>
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query)
      );
    } else {
      // When not searching, exclude popular and trending tokens from main list (they're shown separately)
      // When "All" is selected, only consider Ethereum popular tokens
      const popularTokenList = networkFilter === 'all'
        ? POPULAR_TOKENS.ethereum
        : POPULAR_TOKENS[networkFilter] || [];
      const popularAddresses = popularTokenList.map(t => t.address.toLowerCase());
      const trendingAddresses = trendingTokens.map(t => t.address.toLowerCase());
      filtered = filtered.filter(
        token => {
          const isPopular = popularAddresses.includes(token.address.toLowerCase());
          const isTrending = trendingAddresses.includes(token.address.toLowerCase());
          return !isPopular && !isTrending;
        }
      );
    }

    // Sort alphabetically
    return filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [tokens, searchQuery, networkFilter, excludeToken, trendingTokens]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setNetworkFilter('all'); // Reset to 'all' when opening
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    onOpen?.();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelect = (token: Token) => {
    onSelect(token);
    handleClose();
  };

  return (
    <>
      {variant === 'button' && (
      <button
        type="button"
          onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer ${
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
            className={`w-4 h-4 transition-transform duration-200 ${selectedToken ? 'text-[#737373]' : 'text-white/80'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      )}

      {variant === 'search' && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-green-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative">
            <svg 
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#525252]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for a token and start trading..."
              onClick={handleOpen}
              readOnly
              className="w-full h-14 pl-14 pr-14 bg-[#1A1A1A] border border-[#262626] rounded-full text-white placeholder-[#525252] cursor-pointer hover:border-[#333] hover:bg-[#1f1f1f] transition-all"
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-[#1f1f1f]">
              <div className="relative flex items-center gap-2">
                <svg
                  className="absolute left-4 w-5 h-5 text-[#525252] pointer-events-none"
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
                  ref={inputRef}
                type="text"
                placeholder="Search token name or paste address"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 pl-12 pr-4 py-3 bg-[#1A1A1A] text-white placeholder-[#525252] rounded-xl border border-[#262626] focus:outline-none focus:border-[#333]"
                />
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
            </div>
          </div>

            {/* Network Filter */}
            <div className="px-4 pt-4 pb-2 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNetworkFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    networkFilter === 'all'
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[#1A1A1A] text-[#737373] hover:text-white hover:bg-[#262626]'
                  }`}
                >
                  All
                </button>
                {SUPPORTED_NETWORKS.map(net => (
                  <button
                    key={net.id}
                    onClick={() => setNetworkFilter(net.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      networkFilter === net.id
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-[#1A1A1A] text-[#737373] hover:text-white hover:bg-[#262626]'
                    }`}
                  >
                    {net.id === 'base' ? (
                      // Base logo - blue circle with white inner circle and horizontal blue line
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                      >
                        {/* Outer blue circle */}
                        <circle cx="12" cy="12" r="12" fill="#0052FF" />
                        {/* Inner white circle */}
                        <circle cx="12" cy="12" r="8" fill="white" />
                        {/* Horizontal blue line - starts from left, extends 75% across */}
                        <rect x="4" y="11" width="9" height="2" fill="#0052FF" />
                      </svg>
                    ) : (
                      <img
                        src={NETWORK_LOGOS[net.id]}
                        alt={net.name}
                        className="w-4 h-4 rounded-full"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {net.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tokens */}
            {!searchQuery && popularTokens.length > 0 && (
              <div className="px-4 pt-4 pb-3 border-b border-[#1f1f1f]">
                <h3 className="text-sm font-medium text-[#737373] mb-3 text-left">Most popular</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {popularTokens.map(token => (
                    <button
                      key={`${token.network}-${token.address}`}
                      onClick={() => handleSelect(token)}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-[#1A1A1A] transition-colors group cursor-pointer"
                      title={`${token.name} (${token.symbol})`}
                    >
                      <div className="relative">
                        {token.logoUrl ? (
                          <img
                            src={token.logoUrl}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full group-hover:scale-110 transition-transform"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="%23333"/></svg>';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center group-hover:bg-[#333] transition-colors">
                            <span className="text-white font-medium text-sm">{token.symbol[0]}</span>
                          </div>
                        )}
                        {/* Network badge */}
                        {(NETWORK_LOGOS[token.network] || token.network === 'base') && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center overflow-hidden">
                            {token.network === 'base' ? (
                              // Base logo - blue circle with white inner circle and horizontal blue line
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3 h-3"
                              >
                                {/* Outer blue circle */}
                                <circle cx="12" cy="12" r="12" fill="#0052FF" />
                                {/* Inner white circle */}
                                <circle cx="12" cy="12" r="8" fill="white" />
                                {/* Horizontal blue line - starts from left, extends 75% across */}
                                <rect x="4" y="11" width="9" height="2" fill="#0052FF" />
                              </svg>
                            ) : (
                              <img
                                src={NETWORK_LOGOS[token.network]}
                                alt={token.network}
                                className="w-3 h-3 rounded-full"
                                onError={e => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-[#737373] group-hover:text-white transition-colors font-medium">
                        {token.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Tokens - List format */}
            {!searchQuery && trendingTokens.length > 0 && (
              <div className="border-b border-[#1f1f1f]">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-sm font-medium text-[#737373] mb-2 text-left">Trending</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {trendingTokens.map(token => (
                    <button
                      key={`${token.network}-${token.address}`}
                      onClick={() => handleSelect(token)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      <div className="relative">
                        {token.logoUrl ? (
                          <img
                            src={token.logoUrl}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="%23333"/></svg>';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{token.symbol[0]}</span>
                          </div>
                        )}
                        {/* Network badge */}
                        {(NETWORK_LOGOS[token.network] || token.network === 'base') && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center overflow-hidden">
                            {token.network === 'base' ? (
                              // Base logo - blue circle with white inner circle and horizontal blue line
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3 h-3"
                              >
                                {/* Outer blue circle */}
                                <circle cx="12" cy="12" r="12" fill="#0052FF" />
                                {/* Inner white circle */}
                                <circle cx="12" cy="12" r="8" fill="white" />
                                {/* Horizontal blue line - starts from left, extends 75% across */}
                                <rect x="4" y="11" width="9" height="2" fill="#0052FF" />
                              </svg>
                            ) : (
                              <img
                                src={NETWORK_LOGOS[token.network]}
                                alt={token.network}
                                className="w-3 h-3 rounded-full"
                                onError={e => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-sm text-[#525252] truncate">{token.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#525252] font-mono">
                          {shortenAddress(token.address)}
                        </span>
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Token list - only show when searching */}
            {searchQuery && (
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-[#00DC82]/30 border-t-[#00DC82] rounded-full animate-spin" />
                    <p className="mt-4 text-sm text-[#525252]">Loading tokens...</p>
                  </div>
                ) : sortedAndFilteredTokens.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[#525252]">No tokens found</p>
                  </div>
                ) : (
                  sortedAndFilteredTokens.map(token => (
                <button
                    key={`${token.network}-${token.address}`}
                    onClick={() => handleSelect(token)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                >
                  <div className="relative">
                  {token.logoUrl ? (
                    <img
                      src={token.logoUrl}
                      alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="%23333"/></svg>';
                      }}
                    />
                  ) : (
                      <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{token.symbol[0]}</span>
                    </div>
                  )}
                    {/* Network badge */}
                    {(NETWORK_LOGOS[token.network] || token.network === 'base') && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center overflow-hidden">
                        {token.network === 'base' ? (
                          // Base logo - blue circle with white inner circle and horizontal blue line
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3"
                          >
                            {/* Outer blue circle */}
                            <circle cx="12" cy="12" r="12" fill="#0052FF" />
                            {/* Inner white circle */}
                            <circle cx="12" cy="12" r="8" fill="white" />
                            {/* Horizontal blue line - starts from left, extends 75% across */}
                            <rect x="4" y="11" width="9" height="2" fill="#0052FF" />
                          </svg>
                        ) : (
                          <img
                            src={NETWORK_LOGOS[token.network]}
                            alt={token.network}
                            className="w-3 h-3 rounded-full"
                            onError={e => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-[#525252] truncate">{token.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#525252] font-mono">
                      {shortenAddress(token.address)}
                    </span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  </button>
                ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
