import { db } from '../index'
import { eq } from 'drizzle-orm'
import { dynamicUsers } from '../schema'

export interface DynamicUser {
  id: string
  email: string | null
  walletAddress: string | null
  walletPublicKey: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getDynamicUser(userId: string): Promise<DynamicUser | null> {
  const result = await db
    .select()
    .from(dynamicUsers)
    .where(eq(dynamicUsers.id, userId))
    .limit(1)
  
  return result[0] || null
}

export async function getDynamicUserByEmail(email: string): Promise<DynamicUser | null> {
  const result = await db
    .select()
    .from(dynamicUsers)
    .where(eq(dynamicUsers.email, email))
    .limit(1)
  
  return result[0] || null
}

export async function createOrUpdateDynamicUser(user: {
  id: string
  email: string | null
  walletAddress: string | null
  walletPublicKey: string | null
}): Promise<DynamicUser> {
  const now = new Date()
  
  try {
    console.log('🔄 Creating/updating user in database:', {
      ...user,
      updatedAt: now
    })

    // First try to get the existing user
    const existingUser = await getDynamicUser(user.id)
    
    if (existingUser) {
      // Update existing user
      console.log('🔄 Updating existing user:', existingUser.id)
      const [updated] = await db
        .update(dynamicUsers)
        .set({
          email: user.email,
          walletAddress: user.walletAddress,
          walletPublicKey: user.walletPublicKey,
          updatedAt: now
        })
        .where(eq(dynamicUsers.id, user.id))
        .returning()
      
      console.log('✅ User updated successfully:', updated)
      return updated
    } else {
      // Insert new user
      console.log('🔄 Creating new user')
      const [created] = await db
        .insert(dynamicUsers)
        .values({
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress,
          walletPublicKey: user.walletPublicKey,
          createdAt: now,
          updatedAt: now
        })
        .returning()
      
      console.log('✅ User created successfully:', created)
      return created
    }
  } catch (error) {
    console.error('❌ Database error in createOrUpdateDynamicUser:', error)
    throw error
  }
} 