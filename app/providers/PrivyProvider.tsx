'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import type { PropsWithChildren } from 'react';

export function PrivyProvider({ children }: PropsWithChildren) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
  }

  if (!process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_PRIVY_CLIENT_ID is not set');
  }

  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3B82F6', // blue-500
          showWalletLoginFirst: false,
          logo: '/images/soltar-hero-small.png'
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        }
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}

// Export useful hooks from Privy for use in components
export {
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';