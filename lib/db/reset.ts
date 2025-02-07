import { config } from 'dotenv';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runReset = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

  console.log('⏳ Dropping existing tables...');

  try {
    await sql.unsafe(`
      DROP TABLE IF EXISTS suggestion CASCADE;
      DROP TABLE IF EXISTS document CASCADE;
      DROP TABLE IF EXISTS message CASCADE;
      DROP TABLE IF EXISTS chat CASCADE;
      DROP TABLE IF EXISTS dynamic_users CASCADE;
      DROP TABLE IF EXISTS "user" CASCADE;
      DROP TABLE IF EXISTS __drizzle_migrations CASCADE;
    `);

    console.log('✅ Tables dropped successfully');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to drop tables:', err);
    await sql.end();
    process.exit(1);
  }
};

runReset().catch((err) => {
  console.error('❌ Reset failed');
  console.error(err);
  process.exit(1);
}); 