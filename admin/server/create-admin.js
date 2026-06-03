import 'dotenv/config';
import { db } from './db/index.js';
import { users } from './db/schema.js';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';

async function createAdmin() {
  const email = 'admin@zvenue.in';
  const passwordPlain = 'admin123'; // Default password

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existing) {
      console.log(`Admin user ${email} already exists!`);
      // Update password just in case
      const hashedPassword = await argon2.hash(passwordPlain);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));
      console.log('Password reset to default.');
    } else {
      const hashedPassword = await argon2.hash(passwordPlain);
      await db.insert(users).values({
        email: email,
        password: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        full_name: 'Super Admin',
        phone_number: '+910000000000', // Dummy phone
        phone_verified: true,
      });
      console.log(`Successfully created admin user: ${email}`);
    }
    console.log(`Email: ${email}\nPassword: ${passwordPlain}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
  process.exit(0);
}

createAdmin();
