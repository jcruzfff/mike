import { getAuthToken } from '@dynamic-labs/sdk-react-core'
import type { UserProfile } from '@dynamic-labs/sdk-react-core'
import { NextRequest, NextResponse } from 'next/server'

export interface DynamicJwtPayload {
  alias?: string
  aud: string
  verified_credentials?: Array<{
    address: string
    chain: string
    id: string
    wallet_name: string
  }>
  email?: string
  environment_id: string
  family_name?: string
  given_name?: string
  lists?: string[]
  iss: string
  sub: string
  verified_account?: {
    address: string
    chain: string
    id: string
    wallet_name: string
  }
  iat: number
  exp: number
}

export function getDynamicToken(): string | undefined {
  return getAuthToken()
}

export function transformDynamicUser(user: UserProfile) {
  return {
    id: user.userId,
    email: user.email || null,
    walletAddress: user.verifiedCredentials?.[0]?.address || null,
    walletPublicKey: user.verifiedCredentials?.[0]?.address || null,
  }
}

// Helper to check if user has completed authentication
export function isUserAuthenticated(user: UserProfile | undefined): boolean {
  if (!user) return false
  return !!user.userId && !!user.verifiedCredentials?.length
}

// Middleware to protect routes
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest) {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Extract the token (wallet address)
    const walletAddress = authHeader.split(' ')[1]
    if (!walletAddress) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Call the handler with the authenticated request
    return handler(req)
  }
} 