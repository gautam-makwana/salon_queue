// src/services/publicState.js
// Builds the sanitised public state object broadcast via Socket.IO.
// Never includes customer names or phone numbers in the public payload.

import { prisma } from '../lib/prisma.js';
import { calculateWaitTime } from './waitTime.js';

/**
 * Build the full public queue state for broadcast.
 * Personal fields (customerName, phone) are stripped.
 */
export async function buildPublicQueueState() {
  const [barbers, settings, activeEntries, waitingEntries] = await Promise.all([
    prisma.barber.findMany({ orderBy: { name: 'asc' } }),
    prisma.salonSettings.findUnique({ where: { id: 1 } }),
    prisma.queueEntry.findMany({
      where: { status: { in: ['CALLED', 'IN_CHAIR'] } },
      include: { services: true },
      orderBy: { calledAt: 'asc' },
    }),
    prisma.queueEntry.findMany({
      where: { status: 'WAITING' },
      include: { services: true },
      orderBy: { joinedAt: 'asc' },
    }),
  ]);

  const { estimateMin: globalWait } = await calculateWaitTime({ barberPref: 'ANY' });

  // Public waiting list — first 5 for TV, full for reception
  const publicWaiting = waitingEntries.map((e, idx) => ({
    tokenNumber: e.tokenNumber,
    status:      e.status,
    barberPref:  e.barberPref,
    position:    idx + 1,
    services:    e.services.map((s) => ({ nameEn: s.nameEn, nameGu: s.nameGu, durationMin: s.durationMin })),
  }));

  // Active entries per barber (for TV / barber cards)
  const activeByBarber = {};
  for (const e of activeEntries) {
    if (e.assignedBarber) {
      activeByBarber[e.assignedBarber] = {
        tokenNumber: e.tokenNumber,
        status:      e.status,
        services:    e.services.map((s) => ({ nameEn: s.nameEn, nameGu: s.nameGu, durationMin: s.durationMin })),
        startedAt:   e.startedAt,
        calledAt:    e.calledAt,
      };
    }
  }

  return {
    barbers,
    settings,
    waitingCount:  waitingEntries.length,
    globalWaitMin: globalWait,
    publicWaiting,
    activeByBarber,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Build the reception-level queue state (includes names but not phones).
 */
export async function buildReceptionQueueState() {
  const [waiting, active] = await Promise.all([
    prisma.queueEntry.findMany({
      where: { status: 'WAITING' },
      include: { services: true },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.queueEntry.findMany({
      where: { status: { in: ['CALLED', 'IN_CHAIR'] } },
      include: { services: true },
      orderBy: { calledAt: 'asc' },
    }),
  ]);

  return { waiting, active };
}
