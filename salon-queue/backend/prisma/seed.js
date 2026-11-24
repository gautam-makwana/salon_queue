// prisma/seed.js
// Run with: node prisma/seed.js
// Requires: DATABASE_URL in .env or environment

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Salon Settings ────────────────────────────────────────────────
  await prisma.salonSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      onlineQueueOpen: true,
      closingTime: '23:59',
      openingTime: '09:00',
    },
  });
  console.log('✔ Salon settings');

  // ── Barbers ───────────────────────────────────────────────────────
  const barbers = [
    { name: 'Ravi', status: 'AVAILABLE', onDuty: true },
    { name: 'Amit', status: 'AVAILABLE', onDuty: true },
    { name: 'Imran', status: 'AVAILABLE', onDuty: true },
  ];

  for (const b of barbers) {
    await prisma.barber.upsert({
      where: { name: b.name },
      update: { status: b.status, onDuty: b.onDuty },
      create: b,
    });
  }
  console.log('✔ Barbers (Ravi, Amit, Imran)');

  // ── Services ──────────────────────────────────────────────────────
  const services = [
    { nameEn: 'Haircut',      nameGu: 'હેરકટ',        durationMin: 30, price: 150, enabled: true },
    { nameEn: 'Beard trim',   nameGu: 'દાઢી ટ્રિમ',   durationMin: 15, price: 80,  enabled: true },
    { nameEn: 'Hair spa',     nameGu: 'હેર સ્પા',      durationMin: 45, price: 400, enabled: true },
    { nameEn: 'Hair wash',    nameGu: 'હેર વોશ',       durationMin: 15, price: 100, enabled: true },
    { nameEn: 'Hair styling', nameGu: 'હેર સ્ટાઇલિંગ', durationMin: 20, price: 200, enabled: true },
  ];

  // Upsert by nameEn (stable across reseeds)
  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { nameEn: s.nameEn } });
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: s });
    } else {
      await prisma.service.create({ data: s });
    }
  }
  console.log('✔ Services (5 entries)');

  // ── Staff Accounts ────────────────────────────────────────────────
  const SALT_ROUNDS = 10;

  const staff = [
    { username: 'reception',  password: 'demo1234', role: 'RECEPTION', barberName: null  },
    { username: 'ravi',       password: 'demo1234', role: 'BARBER',    barberName: 'Ravi'  },
    { username: 'amit',       password: 'demo1234', role: 'BARBER',    barberName: 'Amit'  },
    { username: 'imran',      password: 'demo1234', role: 'BARBER',    barberName: 'Imran' },
    { username: 'owner',      password: 'demo1234', role: 'OWNER',     barberName: null  },
  ];

  for (const s of staff) {
    const existing = await prisma.staff.findUnique({ where: { username: s.username } });
    const passwordHash = await bcrypt.hash(s.password, SALT_ROUNDS);
    if (existing) {
      await prisma.staff.update({
        where: { username: s.username },
        data: { passwordHash, role: s.role, barberName: s.barberName },
      });
    } else {
      await prisma.staff.create({
        data: {
          username: s.username,
          passwordHash,
          role: s.role,
          barberName: s.barberName,
        },
      });
    }
  }
  console.log('✔ Staff accounts (reception / ravi / amit / imran / owner — all password: demo1234)');

  console.log('\n✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
