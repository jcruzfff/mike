import { z } from 'zod';

const envSchema = z.object({
  POSTGRES_URL: z.string().min(1),
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  POSTGRES_URL: process.env.POSTGRES_URL,
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
}); 