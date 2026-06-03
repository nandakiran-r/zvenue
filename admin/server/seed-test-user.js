/**
 * seed-test-user.js
 * Creates / updates the test user (+919999900000) in the database.
 * Run once with: node seed-test-user.js
 */
import 'dotenv/config';
import { db } from './db/index.js';
import { users, otps } from './db/schema.js';
import { eq, or } from 'drizzle-orm';

const TEST_USER_PHONE = '+919999900000';
const TEST_USER_OTP   = '123456';
const TEST_USER_EMAIL = 'testuser_new@zvenue.com';

async function seedTestUser() {
  console.log('Seeding test user...\n');

  // 1. Check if test user already exists by phone
  let user = await db.query.users.findFirst({
    where: eq(users.phone_number, TEST_USER_PHONE),
  });

  if (!user) {
    // Check if the old test user email exists and change it
    const oldTestUser = await db.query.users.findFirst({
      where: eq(users.email, 'testuser@zvenue.com'),
    });

    if (oldTestUser) {
      // Update old test user to use the new phone number
      const [updated] = await db.update(users)
        .set({
          phone_number : TEST_USER_PHONE,
          phone_verified: true,
          email        : TEST_USER_EMAIL,
          first_name   : 'Test',
          last_name    : 'User',
          full_name    : 'Test User',
        })
        .where(eq(users.id, oldTestUser.id))
        .returning();
      user = updated;
      console.log(`✓ Old test user UPDATED to new phone — id: ${user.id}`);
    } else {
      // Create fresh test user
      const [created] = await db.insert(users).values({
        phone_number : TEST_USER_PHONE,
        first_name   : 'Test',
        last_name    : 'User',
        full_name    : 'Test User',
        email        : TEST_USER_EMAIL,
        phone_verified: true,
      }).returning();
      user = created;
      console.log(`✓ Test user CREATED  — id: ${user.id}`);
    }
  } else {
    // Ensure phone_verified is true
    await db.update(users)
      .set({ phone_verified: true })
      .where(eq(users.id, user.id));
    console.log(`✓ Test user EXISTS   — id: ${user.id} (phone_verified ensured)`);
  }

  // 2. Insert a fresh OTP entry so the user can log in immediately
  //    (valid for 1 hour so you can test right away)
  const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.insert(otps).values({
    phone_number: TEST_USER_PHONE,
    otp         : TEST_USER_OTP,
    expires_at,
  });
  console.log(`✓ OTP entry inserted — code: ${TEST_USER_OTP}, expires at: ${expires_at.toISOString()}`);

  console.log('\n--- Test credentials ---');
  console.log(`  Phone  : ${TEST_USER_PHONE}`);
  console.log(`  OTP    : ${TEST_USER_OTP}`);
  console.log(`  Razorpay key: rzp_test_Sx1fRFfPteNSvX  (auto-assigned during payments)`);
  console.log('\nDone.');
}

seedTestUser().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
