'use client'

import { createConfig } from 'wagmi'
import { http } from 'viem'
import { mainnet } from 'viem/chains'
import { QueryClient } from '@tanstack/react-query'

// Create Wagmi config
export const wagmiConfig = createConfig({
  chains: [mainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
  },
})

// Create React Query client
export const queryClient = new QueryClient() 