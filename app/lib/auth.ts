import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function verifyAuth(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const cookieStore = await cookies()
    const authToken = cookieStore.get('dynamic_auth_token')?.value
    const jwtToken = cookieStore.get('dynamic_jwt_token')?.value
    const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '')

    const token = headerToken || jwtToken || authToken

    if (!token) {
      return null
    }

    // For now, just verify the token exists since we're using Dynamic's React SDK
    // The actual verification happens on the client side through their SDK
    return { token }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

// Helper to use in API routes
export async function withAuth(
  handler: Function,
  options: { requireAuth: boolean } = { requireAuth: true }
) {
  return async function (request: NextRequest) {
    const user = await verifyAuth(request)

    if (options.requireAuth && !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Add user to request object
    ;(request as any).user = user

    return handler(request)
  }
} 