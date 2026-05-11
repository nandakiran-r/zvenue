import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function fix() {
  try {
    console.log('Altering users table...');
    
    // Add columns if they don't exist
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name varchar(255) DEFAULT ''`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name varchar(255) DEFAULT ''`);
    
    // Update existing rows to have empty string instead of NULL for the new columns
    await db.execute(sql`UPDATE users SET first_name = '' WHERE first_name IS NULL`);
    await db.execute(sql`UPDATE users SET last_name = '' WHERE last_name IS NULL`);
    
    // Set them to NOT NULL
    await db.execute(sql`ALTER TABLE users ALTER COLUMN first_name SET NOT NULL`);
    await db.execute(sql`ALTER TABLE users ALTER COLUMN last_name SET NOT NULL`);

    console.log('Database fixed successfully (first_name and last_name added)!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing database:', err);
    process.exit(1);
  }
}

fix();
