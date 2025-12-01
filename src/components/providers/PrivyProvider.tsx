'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['wallet'], // External wallet only
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'off', // Disable embedded wallets
          },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#8B5CF6',
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}

