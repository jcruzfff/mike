'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useAuth } from '../contexts/AuthContext'

export function AuthButton() {
  const { isAuthenticated, user, logout } = useAuth()
  const { login } = usePrivy()

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">
          {user.email || user.walletAddress?.slice(0, 6) + '...' + user.walletAddress?.slice(-4)}
        </span>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    >
      Login
    </button>
  )
} 