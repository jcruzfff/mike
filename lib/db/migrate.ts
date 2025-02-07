import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

const runMigrate = async () => {
  console.log('🔄 Starting database migration...');

  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined in environment variables');
  }

  try {
    // Use non-pooling connection for migrations
    const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    const connection = postgres(connectionString, { max: 1 });
    const db = drizzle(connection);

    console.log('⏳ Running migrations...');
    const start = Date.now();
    
    await migrate(db, { 
      migrationsFolder: './lib/db/migrations',
      migrationsTable: 'migrations' 
    });
    
    const end = Date.now();
    console.log('✅ Migrations completed in', end - start, 'ms');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrate();
