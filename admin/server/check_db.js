import { db } from './db/index.js';
import { users } from './db/schema.js';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const res = await db.execute(sql`SELECT id, email, phone_number FROM users`);
    console.log('Users data:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
