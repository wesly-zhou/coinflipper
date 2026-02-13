'use client';

import { useEffect, useRef } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { shortenAddress } from '@/lib/transformers';

function formatDetailDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
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
  return <span className={`font-medium ${className}`}>{text}</span>;
}

function getExplorerUrl(txHash: string, network: string): string {
  return network === 'base'
    ? `https://basescan.org/tx/${txHash}`
    : `https://etherscan.io/tx/${txHash}`;
}

function getExplorerName(network: string): string {
  return network === 'base' ? 'Basescan' : 'Etherscan';
}

interface TradeDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TradeDetailModal({ transaction: tx, onClose }: TradeDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleCopyTxHash = () => {
    if (tx.txHash) {
      navigator.clipboard.writeText(tx.txHash);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[#141414] border border-[#1f1f1f] rounded-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-xl font-bold text-white">Trade Details</h2>
            <p className="text-sm text-[#525252] mt-0.5">
              {tx.fromAmount} {tx.fromSymbol} → {tx.toAmount} {tx.toSymbol}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Trade Details */}
        <div className="p-5">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl divide-y divide-[#262626]">
            {/* Sell */}
            <DetailRow label="Sell">
              <span className="text-white font-medium">{tx.fromAmount} {tx.fromSymbol}</span>
            </DetailRow>

            {/* Buy */}
            <DetailRow label="Buy">
              <span className="text-white font-medium">{tx.toAmount} {tx.toSymbol}</span>
            </DetailRow>

            {/* Network */}
            <DetailRow label="Network">
              <div className="flex items-center gap-1.5">
                {tx.network === 'base' ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
                      <path d="M55.5 95C77.315 95 95 77.315 95 55.5S77.315 16 55.5 16 16 33.685 16 55.5 33.685 95 55.5 95z" fill="#fff" />
                      <path d="M55.4 71.1c-8.6 0-15.6-7-15.6-15.6s7-15.6 15.6-15.6c7.8 0 14.3 5.8 15.4 13.3H87c-1.2-17.3-15.6-31-33.1-31-18.3 0-33.2 14.9-33.2 33.2S35.6 88.6 53.9 88.6c17.5 0 31.9-13.7 33.1-31H70.8c-1.1 7.6-7.6 13.5-15.4 13.5z" fill="#0052FF" />
                    </svg>
                    <span className="text-white">Base</span>
                  </>
                ) : (
                  <>
                    <img
                      src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                      alt="Ethereum"
                      className="w-3.5 h-3.5 rounded-full"
                    />
                    <span className="text-white">Ethereum</span>
                  </>
                )}
              </div>
            </DetailRow>

            {/* Date */}
            <DetailRow label="Date">
              <span className="text-white">{formatDetailDate(tx.createdAt)}</span>
            </DetailRow>

            {/* Status */}
            <DetailRow label="Status">
              <StatusBadge status={tx.status} />
            </DetailRow>

            {/* Type */}
            <DetailRow label="Type">
              <span className="text-[#8B5CF6] font-medium">Market</span>
            </DetailRow>

            {/* Tx Hash */}
            {tx.txHash && (
              <DetailRow label="Tx Hash">
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm">{shortenAddress(tx.txHash)}</span>
                  <button
                    onClick={handleCopyTxHash}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                    title="Copy transaction hash"
                  >
                    <svg className="w-3.5 h-3.5 text-[#525252] hover:text-[#A3A3A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </DetailRow>
            )}

            {/* Block Explorer */}
            {tx.txHash && (
              <DetailRow label="Block Explorer">
                <a
                  href={getExplorerUrl(tx.txHash, tx.network)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#8B5CF6] hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  {getExplorerName(tx.network)}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </DetailRow>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-[#525252]">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
