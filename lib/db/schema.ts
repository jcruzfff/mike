import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  walletAddress: text('wallet_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type User = InferSelectModel<typeof users>;

export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  visibility: text('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type Chat = InferSelectModel<typeof chats>;

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id')
    .notNull()
    .references(() => chats.id),
  role: text('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export type Message = InferSelectModel<typeof messages>;

export const documents = pgTable(
  'documents',
  {
    id: text('id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    title: text('title').notNull(),
    content: text('content'),
    kind: text('kind', { enum: ['text', 'code', 'image'] })
      .notNull()
      .default('text'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
      unq: unique().on(table.id, table.createdAt),
    };
  },
);

export type Document = InferSelectModel<typeof documents>;

export const suggestions = pgTable(
  'suggestions',
  {
    id: text('id').notNull(),
    documentId: text('document_id').notNull(),
    documentCreatedAt: timestamp('document_created_at', { withTimezone: true }).notNull(),
    originalText: text('original_text').notNull(),
    suggestedText: text('suggested_text').notNull(),
    description: text('description'),
    isResolved: boolean('is_resolved').notNull().default(false),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [documents.id, documents.createdAt],
    }),
  }),
);

export const account = pgTable('account', {
  userId: uuid('userId')
    .notNull()
    .references(() => users.id),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: timestamp('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
});

export const session = pgTable('session', {
  sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id),
  expires: timestamp('expires').notNull(),
});

export const dynamicUsers = pgTable('dynamic_users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  walletAddress: text('wallet_address'),
  walletPublicKey: text('wallet_public_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})
