import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set')
}

const client = postgres(process.env.POSTGRES_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
})

export const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development',
}) 