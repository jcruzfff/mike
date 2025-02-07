import { withAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest) {
  // The user is available on the request object
  const user = (request as any).user;

  return NextResponse.json({
    message: 'Protected route',
    user
  });
}

// Wrap the handler with auth middleware
export const GET = withAuth(handler); 