'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupportedNetwork } from '@/types';

export interface Transaction {
  id: string;
  walletAddress: string;
  fromToken: string;
  toToken: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
  txHash: string | null;
  status: string;
  network: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

interface UseTransactionsOptions {
  wallet: string | null;
  network?: SupportedNetwork | 'all';
  limit?: number;
}

export function useTransactions({ wallet, network = 'all', limit = 20 }: UseTransactionsOptions) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (newOffset = 0) => {
      if (!wallet) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          wallet,
          limit: limit.toString(),
          offset: newOffset.toString(),
        });

        const response = await fetch(`/api/transactions?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data: TransactionsResponse = await response.json();

        // Filter by network client-side if needed
        const filtered =
          network === 'all'
            ? data.transactions
            : data.transactions.filter((tx) => tx.network === network);

        setTransactions(filtered);
        setTotal(data.total);
        setOffset(newOffset);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [wallet, network, limit]
  );

  useEffect(() => {
    setOffset(0);
    fetchTransactions(0);
  }, [fetchTransactions]);

  const loadMore = useCallback(() => {
    const newOffset = offset + limit;
    if (newOffset < total) {
      fetchTransactions(newOffset);
    }
  }, [offset, limit, total, fetchTransactions]);

  const loadPrevious = useCallback(() => {
    const newOffset = Math.max(0, offset - limit);
    fetchTransactions(newOffset);
  }, [offset, limit, fetchTransactions]);

  const refetch = useCallback(() => {
    fetchTransactions(offset);
  }, [fetchTransactions, offset]);

  return {
    transactions,
    total,
    offset,
    loading,
    error,
    hasMore: offset + limit < total,
    hasPrevious: offset > 0,
    loadMore,
    loadPrevious,
    refetch,
  };
}
