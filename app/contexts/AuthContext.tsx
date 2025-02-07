'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import type { ReactNode } from 'react'

// Define our User type
interface User {
  id: string
  email: string | null
  walletAddress: string | null
  walletPublicKey: string | null
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  logout: async () => {}
})

export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const isMountedRef = useRef(false)
  const lastUserRef = useRef<string | null>(null)
  
  const { 
    ready,
    authenticated,
    user,
    logout: privyLogout
  } = usePrivy()

  const { wallets } = useWallets()
  const primaryWallet = wallets?.[0] // Use first wallet as primary

  const transformUserData = useCallback((): User | null => {
    if (!user || !authenticated) return null;

    return {
      id: user.id,
      email: typeof user.email === 'string' ? user.email : null,
      walletAddress: primaryWallet?.address || null,
      walletPublicKey: primaryWallet?.address || null
    }
  }, [user, authenticated, primaryWallet])

  const syncUserWithDatabase = useCallback(async (userData: User) => {
    if (!isMountedRef.current) return null;

    // Prevent duplicate syncs
    const userDataString = JSON.stringify(userData)
    if (userDataString === lastUserRef.current) {
      return null
    }
    lastUserRef.current = userDataString

    try {
      console.log('🔄 Syncing user with database:', {
        id: userData.id,
        walletPublicKey: userData.walletPublicKey
      })

      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error('Failed to sync user with database')
      }

      const data = await response.json()
      
      if (isMountedRef.current) {
        console.log('✅ User synced successfully')
      }
      
      return data.user as User
    } catch (error) {
      console.error('❌ Error syncing user with database:', error)
      return null
    }
  }, [])

  const handleAuthStateChange = useCallback(async () => {
    if (!ready) {
      return
    }

    if (authenticated && user) {
      const transformedUser = transformUserData()
      if (transformedUser) {
        const syncedUser = await syncUserWithDatabase(transformedUser)
        setCurrentUser(syncedUser || transformedUser)
      }
    } else {
      setCurrentUser(null)
    }
    
    setLoading(false)
  }, [ready, authenticated, user, transformUserData, syncUserWithDatabase])

  const logout = useCallback(async () => {
    try {
      console.log('🔐 Initiating logout')
      setLoading(true)
      lastUserRef.current = null
      await privyLogout()
      setCurrentUser(null)
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
    } finally {
      setLoading(false)
    }
  }, [privyLogout])

  // Memoize the auth value to prevent unnecessary re-renders
  const authValue = useMemo(() => ({
    isAuthenticated: !!currentUser && !loading,
    user: currentUser,
    loading,
    logout
  }), [currentUser, loading, logout])

  // Handle auth state changes
  useEffect(() => {
    handleAuthStateChange()
  }, [handleAuthStateChange])

  // Handle component mount/unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 