-- Drop old tables if they exist
DROP TABLE IF EXISTS "dynamic_users" CASCADE;
DROP TABLE IF EXISTS "suggestion" CASCADE;
DROP TABLE IF EXISTS "document" CASCADE;
DROP TABLE IF EXISTS "message" CASCADE;
DROP TABLE IF EXISTS "chat" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Create new tables
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,
  "email" text UNIQUE,
  "wallet_address" text,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "chats" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "visibility" text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" text PRIMARY KEY,
  "chat_id" text NOT NULL REFERENCES "chats"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "content" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" text NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
  "title" text NOT NULL,
  "content" text,
  "kind" text NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'code', 'image')),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  PRIMARY KEY ("id", "created_at")
);

CREATE TABLE IF NOT EXISTS "suggestions" (
  "id" text NOT NULL PRIMARY KEY,
  "document_id" text NOT NULL,
  "document_created_at" timestamptz NOT NULL,
  "original_text" text NOT NULL,
  "suggested_text" text NOT NULL,
  "description" text,
  "is_resolved" boolean NOT NULL DEFAULT false,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("document_id", "document_created_at") REFERENCES "documents"("id", "created_at") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "chats_user_id_idx" ON "chats"("user_id");
CREATE INDEX IF NOT EXISTS "messages_chat_id_idx" ON "messages"("chat_id");
CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "documents"("user_id");
CREATE INDEX IF NOT EXISTS "suggestions_document_id_idx" ON "suggestions"("document_id", "document_created_at"); 