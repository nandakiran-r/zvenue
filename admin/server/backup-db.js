import 'dotenv/config';
import { db } from './db/index.js';
import {
  users, venues, categories, bookings, notifications, otps,
  owners, support_tickets, reviews, service_categories,
  service_listings, service_bookings, service_reviews, service_favorites
} from './db/schema.js';
import fs from 'fs';
import path from 'path';

async function backupDb() {
  console.log('Starting database backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const backup = {};

  const tables = [
    { name: 'users', table: users },
    { name: 'owners', table: owners },
    { name: 'categories', table: categories },
    { name: 'otps', table: otps },
    { name: 'venues', table: venues },
    { name: 'bookings', table: bookings },
    { name: 'notifications', table: notifications },
    { name: 'support_tickets', table: support_tickets },
    { name: 'reviews', table: reviews },
    { name: 'service_categories', table: service_categories },
    { name: 'service_listings', table: service_listings },
    { name: 'service_bookings', table: service_bookings },
    { name: 'service_reviews', table: service_reviews },
    { name: 'service_favorites', table: service_favorites },
  ];

  for (const { name, table } of tables) {
    try {
      const rows = await db.select().from(table);
      backup[name] = rows;
      console.log(`  ✓ ${name}: ${rows.length} rows`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      backup[name] = [];
    }
  }

  backup._meta = {
    created_at: new Date().toISOString(),
    tables: tables.map(t => t.name),
  };

  // Write to backups/ directory
  const backupDir = path.resolve('./backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const filename = path.join(backupDir, `db-backup-${timestamp}.json`);
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2), 'utf-8');

  console.log(`\nBackup saved to: ${filename}`);
  console.log(`Total records backed up: ${Object.values(backup).filter(v => Array.isArray(v)).reduce((s, a) => s + a.length, 0)}`);
}

backupDb().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
