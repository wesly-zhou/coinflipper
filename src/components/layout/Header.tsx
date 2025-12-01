'use client';

import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { Logo } from './Logo';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-sm">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
