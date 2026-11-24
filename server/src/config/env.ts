import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from server root or process.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  DATABASE_URL: isTest
    ? z.string().default('postgresql://postgres:postgres@localhost:5432/sweety_test_db?schema=public')
    : z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: isTest
    ? z.string().default('test_jwt_secret_key_must_be_at_least_32_characters_long')
    : z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default(isTest ? 'test' : 'development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(16).default(12),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ CRITICAL: Environment variable validation failed:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  throw new Error('Invalid environment configuration. Check your .env file against .env.example.');
}

export const env = parseResult.data;
export type Env = z.infer<typeof envSchema>;
