import { jwtVerify, createRemoteJWKSet } from 'jose';

// Interface for the verified JWT payload
interface PrivyJWTPayload {
  sub: string;  // Privy user ID
  wallet_address?: string;
  email?: string;
  iat: number;
  exp: number;
}

// Get JWKS (JSON Web Key Set) from Privy
export async function getJwks() {
  if (!process.env.PRIVY_JWKS_URL) {
    throw new Error('PRIVY_JWKS_URL is not set');
  }
  
  return createRemoteJWKSet(new URL(process.env.PRIVY_JWKS_URL));
}

// Verify JWT token
export async function verifyJwt(token: string, jwks: ReturnType<typeof createRemoteJWKSet>): Promise<PrivyJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: 'privy.io'
    });
    
    return payload as PrivyJWTPayload;
  } catch (error) {
    console.error('Failed to verify JWT:', error);
    return null;
  }
} 