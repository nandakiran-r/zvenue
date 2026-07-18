import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

// Setup database connection using postgres.js (TCP, persistent connection pool)
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { 
  max: 10, // max connections in pool
  idle_timeout: 30,
});
export const db = drizzle(sql, { schema });
