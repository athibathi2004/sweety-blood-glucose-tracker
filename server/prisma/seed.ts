/**
 * Sweety Database Demo Seed Script
 * Generates an idempotent demo user and realistic synthetic glucose tracking data.
 *
 * Demo Credentials (Local Evaluation Only):
 * Email:    demo@sweety.app
 * Password: SweetyDemo@2026
 *
 * Execution:
 *   npm --prefix server run prisma:seed
 *   or from root: npm run seed
 */

import { PrismaClient, TimeSlot } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedReading {
  date: string; // YYYY-MM-DD
  slot: TimeSlot;
  glucoseValue: number;
}

function parseUtcDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateString(daysOffset: number): string {
  const now = new Date();
  now.setDate(now.getDate() + daysOffset);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  console.log('--- Sweety Demo Data Seeder ---');
  console.log('Seeding demo patient account and synthetic glucose readings...');

  // 1. Create or update the demo user idempotently
  const DEMO_EMAIL = 'demo@sweety.app';
  const DEMO_RAW_PASSWORD = 'SweetyDemo@2026';
  const hashedPassword = await bcrypt.hash(DEMO_RAW_PASSWORD, 12);

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: 'Sweety Demo Patient',
      password: hashedPassword,
    },
    create: {
      name: 'Sweety Demo Patient',
      email: DEMO_EMAIL,
      password: hashedPassword,
    },
  });

  console.log(`Demo user ready: ${demoUser.name} (${demoUser.email}) [ID: ${demoUser.id}]`);

  // 2. Generate realistic synthetic glucose readings
  // Invariants:
  // - Permitted slots: MORNING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER
  // - Max 4 readings per day (1 per slot)
  // - Range: 40-600 mg/dl (realistic normal-to-mildly elevated: 82 - 165 mg/dl)
  // - No future dates
  const readingsToSeed: SeedReading[] = [];

  const todayStr = getTodayString();

  // A. Today's Readings (2 of 4 logged, leaving Lunch & Dinner for live demo testing)
  readingsToSeed.push(
    { date: todayStr, slot: 'MORNING', glucoseValue: 94 },
    { date: todayStr, slot: 'AFTER_BREAKFAST', glucoseValue: 132 }
  );

  // B. Recent Days (Past 14 days relative to today)
  for (let offset = -1; offset >= -14; offset--) {
    const dStr = getOffsetDateString(offset);
    readingsToSeed.push(
      { date: dStr, slot: 'MORNING', glucoseValue: 88 + (Math.abs(offset * 7) % 18) },
      { date: dStr, slot: 'AFTER_BREAKFAST', glucoseValue: 124 + (Math.abs(offset * 11) % 24) },
      { date: dStr, slot: 'AFTER_LUNCH', glucoseValue: 118 + (Math.abs(offset * 13) % 22) },
      { date: dStr, slot: 'AFTER_DINNER', glucoseValue: 112 + (Math.abs(offset * 5) % 20) }
    );
  }

  // C. Full Previous Calendar Month (October 2026) for Previous-Month Report
  // Generates 31 days of continuous realistic trend data
  for (let day = 1; day <= 31; day++) {
    const dayStr = `2026-10-${String(day).padStart(2, '0')}`;
    readingsToSeed.push(
      { date: dayStr, slot: 'MORNING', glucoseValue: 90 + ((day * 3) % 15) },
      { date: dayStr, slot: 'AFTER_BREAKFAST', glucoseValue: 128 + ((day * 7) % 25) },
      { date: dayStr, slot: 'AFTER_LUNCH', glucoseValue: 120 + ((day * 5) % 20) },
      { date: dayStr, slot: 'AFTER_DINNER', glucoseValue: 115 + ((day * 2) % 18) }
    );
  }

  // 3. Upsert all readings idempotently using the composite unique constraint
  let insertedOrUpdated = 0;
  for (const item of readingsToSeed) {
    const readingDate = parseUtcDate(item.date);
    await prisma.reading.upsert({
      where: {
        unique_user_date_timeslot: {
          userId: demoUser.id,
          readingDate,
          timeSlot: item.slot,
        },
      },
      update: {
        glucoseValue: item.glucoseValue,
      },
      create: {
        userId: demoUser.id,
        readingDate,
        timeSlot: item.slot,
        glucoseValue: item.glucoseValue,
      },
    });
    insertedOrUpdated++;
  }

  console.log(`Successfully seeded ${insertedOrUpdated} readings for demo patient.`);
  console.log('--------------------------------------------------');
  console.log('DEMO EVALUATION CREDENTIALS:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_RAW_PASSWORD}`);
  console.log('NOTE: Demo credentials are for local evaluation only and must never be used in production.');
  console.log('--------------------------------------------------');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Seed encountered an error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
