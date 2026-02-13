'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { Logo } from './Logo';

export default function Header() {
  const { authenticated } = usePrivy();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-sm">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {authenticated && (
              <Link
                href="/history"
                className="text-sm text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                Trade History
              </Link>
            )}
            <ConnectWallet />
          </div>
        </div>
      </div>
    </header>
  );
}
