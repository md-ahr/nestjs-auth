import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. For local dev, copy .env.example to .env. On Vercel, add DATABASE_URL under Project → Settings → Environment Variables.',
  );
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
