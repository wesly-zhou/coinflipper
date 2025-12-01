'use client';

import { useLogin, useWallets, usePrivy, useLogout } from '@privy-io/react-auth';
import { useState, useEffect, useRef } from 'react';
import { shortenAddress } from '@/lib/transformers';
import { formatTokenAmount } from '@/lib/transformers';

export function ConnectWallet() {
  const { login } = useLogin();
  const { logout } = useLogout();
  const { wallets } = useWallets();
  const { authenticated, ready } = usePrivy();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [usdValue, setUsdValue] = useState<string>('0.00');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the primary wallet
  const primaryWallet = wallets[0];
  const address = primaryWallet?.address;

  // Fetch wallet balance
  useEffect(() => {
    if (!primaryWallet || !address) return;

    const fetchBalance = async () => {
      try {
        const provider = await primaryWallet.getEthereumProvider();
        // Use eth_getBalance RPC call
        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        const balance = BigInt(balanceHex);
        const ethBalance = formatTokenAmount(balance.toString(), 18);
        setBalance(ethBalance);

        // Fetch ETH price for USD conversion (simplified - you might want to use a price API)
        // For now, we'll just show the ETH balance
        setUsdValue('0.00'); // TODO: Fetch actual ETH price
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [primaryWallet, address]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await login();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };


  if (!ready) {
    return (
      <div className="px-4 py-2 bg-[#1A1A1A] rounded-full border border-[#262626]">
        <div className="w-4 h-4 border-2 border-[#00DC82]/30 border-t-[#00DC82] rounded-full animate-spin" />
      </div>
    );
  }

  if (authenticated && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#262626] rounded-full border border-[#262626] transition-colors cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#8B5CF6] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <span className="text-sm text-white font-medium font-mono">
            {shortenAddress(address)}
          </span>
          <svg
            className={`w-4 h-4 text-[#737373] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-[#1f1f1f]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-white font-medium font-mono">
                    {address.slice(0, 8)}...{address.slice(-6)}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-1.5 hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
                  title="Disconnect wallet"
                >
                  <svg
                    className="w-4 h-4 text-[#737373]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-[#737373]">
                {balance} ETH · ${usdValue}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}

