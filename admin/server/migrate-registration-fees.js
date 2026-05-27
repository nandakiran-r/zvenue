/**
 * One-time migration script: Assign random registration fees to existing venues
 * that have registration_fee = 0 or NULL.
 *
 * Run: node admin/server/migrate-registration-fees.js
 */
import 'dotenv/config';
import { db } from './db/index.js';
import { venues } from './db/schema.js';
import { eq, or, isNull, sql } from 'drizzle-orm';

async function migrateRegistrationFees() {
  console.log('🔄 Starting registration fee migration...\n');

  // Find all venues with zero or null registration_fee
  const venuesWithoutFee = await db.query.venues.findMany({
    where: or(
      isNull(venues.registration_fee),
      eq(venues.registration_fee, 0)
    ),
    columns: { id: true, name: true, registration_fee: true },
  });

  if (venuesWithoutFee.length === 0) {
    console.log('✅ All venues already have a registration fee. Nothing to update.');
    process.exit(0);
  }

  console.log(`Found ${venuesWithoutFee.length} venues without registration fee.\n`);

  let updatedCount = 0;

  for (const venue of venuesWithoutFee) {
    // Generate random fee between ₹1,000 and ₹5,000
    const randomFee = Math.floor(Math.random() * 4000) + 1000;

    await db.update(venues)
      .set({ registration_fee: randomFee })
      .where(eq(venues.id, venue.id));

    console.log(`  Updated: "${venue.name}" (id: ${venue.id}) → registration_fee: ₹${randomFee.toLocaleString('en-IN')}`);
    updatedCount++;
  }

  console.log(`\n✅ Migration complete. Updated ${updatedCount} venues total.`);
  process.exit(0);
}

migrateRegistrationFees().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
