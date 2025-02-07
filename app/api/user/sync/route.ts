import { NextResponse } from 'next/server';
import { createOrUpdateDynamicUser } from '@/lib/db/queries/dynamic-users';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    console.log('📥 Received user data:', userData);

    if (!userData.id) {
      console.error('❌ Missing required user ID');
      return NextResponse.json(
        { error: 'Missing required user ID' },
        { status: 400 }
      );
    }

    // Ensure we have the required fields
    const userToSync = {
      id: userData.id,
      email: userData.email || null,
      walletAddress: userData.walletAddress || null,
      walletPublicKey: userData.walletPublicKey || null
    };

    console.log('🔄 Syncing user:', userToSync);

    const user = await createOrUpdateDynamicUser(userToSync);
    console.log('✅ User synced successfully:', user);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to sync user with database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 