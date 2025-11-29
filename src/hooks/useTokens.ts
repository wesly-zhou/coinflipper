'use client';

import { useState, useEffect, useCallback } from 'react';
import { Token, SupportedNetwork } from '@/types';
import { SUPPORTED_NETWORKS, DEFAULT_NETWORK, TOKEN_LIST_URLS, FALLBACK_TOKENS } from '@/lib/constants';

interface UseTokensResult {
    tokens: Token[];
    loading: boolean;
    error: string | null;
    network: SupportedNetwork;
    setNetwork: (network: SupportedNetwork) => void;
    getTokenBySymbol: (symbol: string) => Token | undefined;
    getTokenByAddress: (address: string) => Token | undefined;
    searchTokens: (query: string) => Token[];
}

export function useTokens(initialNetwork: SupportedNetwork = DEFAULT_NETWORK): UseTokensResult {
    const [network, setNetwork] = useState<SupportedNetwork>(initialNetwork);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchTokens = async () => {
            try {
                const response = await fetch(`/api/tokens?network=${network}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setTokens(data.tokens);
            } catch (error) {
                console.error('Failed to fetch ${network} token list:', error);
                console.log('Using fallback tokens for ${network}');
                setTokens(FALLBACK_TOKENS[network as SupportedNetwork]);
            } finally {
                setLoading(false);
            }
        };
        fetchTokens();
    }, [network]);

    const getTokenBySymbol = useCallback((symbol: string): Token | undefined => {
        return tokens.find((t: Token) => t.symbol.toLowerCase() === symbol.toLowerCase());
    }, [tokens]);
    
    const getTokenByAddress = useCallback((address: string): Token | undefined => {
        return tokens.find((t: Token) => t.address.toLowerCase() === address.toLowerCase());
    }, [tokens]);
    
    const searchTokens = useCallback((query: string): Token[] => {
        if (!query) return tokens;
        const lowerQuery = query.toLowerCase();
        return tokens.filter((t: Token) => (
            t.symbol.toLowerCase().includes(lowerQuery) ||
            t.name.toLowerCase().includes(lowerQuery) ||
            t.address.toLowerCase().includes(lowerQuery)
        ));
    }, [tokens]);

    return {
        tokens,
        loading,
        error,
        network,
        setNetwork,
        getTokenBySymbol,
        getTokenByAddress,
        searchTokens,
    };
}
