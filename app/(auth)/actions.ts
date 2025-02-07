'use server';

import { z } from 'zod';
import { createUser, getUser } from '@/lib/db/queries';

const userSchema = z.object({
  walletAddress: z.string(),
  email: z.string().email().optional().nullable(),
});

export interface UserActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'user_exists' | 'invalid_data';
}

export const syncUserWithDatabase = async (
  walletAddress: string,
  email?: string | null
): Promise<UserActionState> => {
  try {
    console.log('🔄 Syncing user with database:', { walletAddress, email });
    
    // Validate the data
    const validatedData = userSchema.parse({
      walletAddress,
      email,
    });

    // Check if user exists
    const [existingUser] = await getUser(walletAddress);

    if (existingUser) {
      console.log('✅ User already exists in database');
      return { status: 'user_exists' };
    }

    // Create new user
    console.log('📝 Creating new user in database');
    await createUser(validatedData.walletAddress, validatedData.email);
    console.log('✅ User created successfully');

    return { status: 'success' };
  } catch (error) {
    console.error('❌ Error syncing user with database:', error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    return { status: 'failed' };
  }
};
