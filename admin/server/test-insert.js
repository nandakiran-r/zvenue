import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema.js';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function main() {
  try {
    const res = await db.insert(schema.venues).values({
      name: 'Test',
      city: 'City',
      price_per_hour: 100, // Not in schema!
      category_id: null
    }).returning();
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
main();
