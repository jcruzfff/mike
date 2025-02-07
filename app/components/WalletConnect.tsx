'use client'

import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useAccount } from 'wagmi'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()

  return (
    <div>
      <DynamicWidget />
      
      {isConnected && (
        <div className="mt-4">
          <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
          <p>Address: {address}</p>
          <p>Network: {chain?.name} (Chain ID: {chain?.id})</p>
        </div>
      )}
    </div>
  )
} 