# Migration Guide: Dynamic to Privy

## Overview

This document outlines the step-by-step process for migrating from Dynamic Wallet to Privy for authentication and wallet management in the Ask Mike application. The migration will maintain all existing functionality while transitioning to Privy's authentication system.

## Current Implementation Analysis

### Dynamic Integration Points

1. **Provider Setup**

   - Location: `app/providers/DynamicProvider.tsx`
   - Purpose: Main Dynamic context provider and configuration

2. **Authentication Components**

   - `components/hero-section.tsx`: Login widget
   - `components/sidebar-user-nav.tsx`: User navigation
   - `components/multimodal-input.tsx`: User interaction
   - Multiple components using `useDynamicContext`

3. **Database Schema**
   ```typescript
   // Current Dynamic Users Table
   export const dynamicUsers = pgTable("dynamic_users", {
     id: text("id").primaryKey(),
     email: text("email").unique(),
     walletAddress: text("wallet_address"),
     walletPublicKey: text("wallet_public_key"),
     createdAt: timestamp("created_at"),
     updatedAt: timestamp("updated_at"),
   });
   ```

## Migration Steps

### 1. Initial Setup

1. **Remove Dynamic Dependencies**

   ```bash
   npm remove @dynamic-labs/ethereum @dynamic-labs/sdk-api @dynamic-labs/sdk-react-core @dynamic-labs/solana @dynamic-labs/wagmi-connector
   ```

2. **Install Privy Dependencies**

   ```bash
   npm install @privy-io/react-auth
   ```

3. **Configure Privy**
   - Create new Privy account
   - Get API keys and configuration
   - Set up email authentication in Privy dashboard

### 2. Provider Migration

1. **Create New Privy Provider**

   - Create: `app/providers/PrivyProvider.tsx`
   - Replace Dynamic provider in app root

2. **Update Authentication Context**
   - Create new auth context using Privy
   - Migrate authentication state management
   - Update user session handling

### 3. Component Updates

1. **Authentication Components**

   - Update login/signup flows
   - Replace Dynamic widget with Privy components
   - Update wallet connection UI

2. **Context Usage Updates**
   - Replace all `useDynamicContext` with Privy hooks
   - Update wallet state management
   - Update user profile handling

### 4. Database Migration

1. **Schema Updates**

   ```typescript
   // New Privy Users Table
   export const privyUsers = pgTable("privy_users", {
     id: text("id").primaryKey(),
     email: text("email").unique(),
     walletAddress: text("wallet_address"),
     walletPublicKey: text("wallet_public_key"),
     createdAt: timestamp("created_at"),
     updatedAt: timestamp("updated_at"),
   });
   ```

2. **Data Migration Script**
   - Create migration script for existing users
   - Ensure data consistency
   - Handle edge cases

### 5. File-by-File Migration Checklist

1. **Provider Files**

   - [ ] Delete: `app/providers/DynamicProvider.tsx`
   - [ ] Create: `app/providers/PrivyProvider.tsx`
   - [ ] Update: `app/providers.tsx`

2. **Component Files**

   - [ ] Update: `components/hero-section.tsx`
   - [ ] Update: `components/sidebar-user-nav.tsx`
   - [ ] Update: `components/multimodal-input.tsx`
   - [ ] Update: `components/app-sidebar.tsx`
   - [ ] Update: `components/chat.tsx`
   - [ ] Update: `components/sidebar-history.tsx`

3. **Authentication Files**

   - [ ] Update: `lib/auth.ts`
   - [ ] Update: `contexts/auth-context.tsx`

4. **Database Files**
   - [ ] Create: `lib/db/migrations/privy_migration.ts`
   - [ ] Update: `lib/db/schema.ts`

### 6. Testing Plan

1. **Authentication Flow**

   - [ ] Email sign-in
   - [ ] Wallet connection
   - [ ] Session persistence
   - [ ] Logout flow

2. **Data Verification**

   - [ ] User data migration
   - [ ] Wallet associations
   - [ ] Chat history preservation

3. **Component Testing**
   - [ ] UI components
   - [ ] Authentication state
   - [ ] Wallet interactions

### 7. Rollback Plan

1. **Backup**

   - Take database snapshot before migration
   - Backup all modified files

2. **Rollback Steps**
   - Restore previous dependencies
   - Revert code changes
   - Restore database if needed

## Implementation Order

1. Set up Privy infrastructure
2. Create new provider and authentication context
3. Update database schema
4. Create migration scripts
5. Update components one by one
6. Test thoroughly
7. Deploy changes
8. Monitor for issues

## Notes

- Keep both systems running in parallel during migration
- Test each component thoroughly after updates
- Monitor user sessions during transition
- Have support ready for user assistance

## Security Considerations

- Secure API key storage
- Proper session management
- Secure wallet handling
- Data migration security

## Post-Migration Tasks

1. Remove old Dynamic code
2. Update documentation
3. Monitor for issues
4. Collect user feedback
