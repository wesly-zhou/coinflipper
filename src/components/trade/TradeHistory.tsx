'use client';

import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { SupportedNetwork } from '@/types';
import TradeDetailModal from '@/components/trade/TradeDetailModal';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; className: string }> = {
    completed: { text: 'Success', className: 'text-[#00DC82]' },
    pending: { text: 'Pending', className: 'text-yellow-400' },
    failed: { text: 'Failed', className: 'text-red-400' },
  };
  const { text, className } = config[status] || { text: status, className: 'text-[#737373]' };
  return <span className={`text-sm font-medium ${className}`}>{text}</span>;
}

function NetworkBadge({ network }: { network: string }) {
  if (network === 'base') {
    return (
      <div className="flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
          <path d="M55.5 95C77.315 95 95 77.315 95 55.5S77.315 16 55.5 16 16 33.685 16 55.5 33.685 95 55.5 95z" fill="#fff" />
          <path d="M55.4 71.1c-8.6 0-15.6-7-15.6-15.6s7-15.6 15.6-15.6c7.8 0 14.3 5.8 15.4 13.3H87c-1.2-17.3-15.6-31-33.1-31-18.3 0-33.2 14.9-33.2 33.2S35.6 88.6 53.9 88.6c17.5 0 31.9-13.7 33.1-31H70.8c-1.1 7.6-7.6 13.5-15.4 13.5z" fill="#0052FF" />
        </svg>
        <span className="text-sm text-[#A3A3A3]">Base</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <img
        src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
        alt="Ethereum"
        className="w-4 h-4 rounded-full"
      />
      <span className="text-sm text-[#A3A3A3]">Ethereum</span>
    </div>
  );
}

function exportToCsv(transactions: Transaction[]) {
  const headers = ['Date', 'Sell Amount', 'Sell Token', 'Buy Amount', 'Buy Token', 'Network', 'Status', 'Tx Hash'];
  const rows = transactions.map((tx) => [
    new Date(tx.createdAt).toISOString(),
    tx.fromAmount,
    tx.fromSymbol,
    tx.toAmount,
    tx.toSymbol,
    tx.network,
    tx.status,
    tx.txHash || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `coinflipper-trades-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function TradeHistory() {
  const { wallets } = useWallets();
  const primaryWallet = wallets[0];
  const [networkFilter, setNetworkFilter] = useState<SupportedNetwork | 'all'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const {
    transactions,
    total,
    loading,
    error,
    hasMore,
    hasPrevious,
    loadMore,
    loadPrevious,
  } = useTransactions({
    wallet: primaryWallet?.address || null,
    network: networkFilter,
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Trade History</h1>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl overflow-hidden">
        {/* Filters Row */}
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            {/* Network Filter */}
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value as SupportedNetwork | 'all')}
              className="px-3 py-1.5 bg-[#1A1A1A] border border-[#262626] rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-[#525252] appearance-none pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              <option value="all">All networks</option>
              <option value="base">Base</option>
              <option value="ethereum">Ethereum</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {transactions.length > 0 && (
              <button
                onClick={() => exportToCsv(transactions)}
                className="px-3 py-1.5 bg-[#1A1A1A] border border-[#262626] rounded-lg text-sm text-[#A3A3A3] hover:text-white hover:border-[#525252] transition-colors cursor-pointer"
              >
                Export
              </button>
            )}
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1fr_120px_180px_80px] gap-4 px-4 py-3 border-b border-[#1f1f1f] text-xs text-[#525252] font-medium uppercase tracking-wider">
          <div>Sell</div>
          <div>Buy</div>
          <div>Network</div>
          <div>Date</div>
          <div>Status</div>
        </div>

        {/* Loading State */}
        {loading && transactions.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#00DC82]/30 border-t-[#00DC82] rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-16">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg className="w-12 h-12 text-[#262626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-[#525252] text-sm">No trades yet</p>
          </div>
        )}

        {/* Transaction Rows */}
        {transactions.map((tx) => (
          <button
            key={tx.id}
            onClick={() => setSelectedTx(tx)}
            className="grid grid-cols-[1fr_1fr_120px_180px_80px] gap-4 px-4 py-3.5 border-b border-[#1f1f1f] hover:bg-[#1A1A1A] transition-colors cursor-pointer w-full text-left"
          >
            {/* Sell */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">{tx.fromAmount} {tx.fromSymbol}</span>
            </div>
            {/* Buy */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">{tx.toAmount} {tx.toSymbol}</span>
            </div>
            {/* Network */}
            <NetworkBadge network={tx.network} />
            {/* Date */}
            <div className="text-sm text-[#A3A3A3]">{formatDate(tx.createdAt)}</div>
            {/* Status */}
            <StatusBadge status={tx.status} />
          </button>
        ))}

        {/* Pagination */}
        {(hasPrevious || hasMore) && (
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={loadPrevious}
              disabled={!hasPrevious}
              className="px-3 py-1.5 text-sm text-[#A3A3A3] hover:text-white disabled:text-[#262626] disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={loadMore}
              disabled={!hasMore}
              className="px-3 py-1.5 text-sm text-[#A3A3A3] hover:text-white disabled:text-[#262626] disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {selectedTx && (
        <TradeDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
