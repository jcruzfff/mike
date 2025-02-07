import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!POSTGRES_URL) {
  throw new Error('Neither POSTGRES_URL nor DATABASE_URL is set in .env.local');
}

console.log('🔄 Connecting to database...');

const client = postgres(POSTGRES_URL, {
  max: 1,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = drizzle(client);

async function resetDatabase() {
  try {
    console.log('📖 Reading migration file...');
    const sqlPath = join(process.cwd(), 'lib', 'db', 'migrations', '0000_keen_devos.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    console.log('🗑️ Dropping existing tables...');
    await client.unsafe(sqlContent);
    
    console.log('✅ Successfully reset database!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    await client.end();
    process.exit(1);
  }
}

resetDatabase(); 