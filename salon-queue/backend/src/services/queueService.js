// src/services/queueService.js
// All atomic queue state transitions live here.
// Every function that changes queue state emits a Socket.IO event AFTER commit.

import { prisma } from '../lib/prisma.js';
import { getIO } from '../lib/socket.js';
import { buildPublicQueueState } from './publicState.js';

// Status transition map — the only allowed moves
const TRANSITIONS = {
  WAITING:  ['CALLED', 'CANCELLED'],
  CALLED:   ['IN_CHAIR', 'NO_SHOW'],
  IN_CHAIR: ['DONE'],
};

export function isValidTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

/** Broadcast current state to all connected clients */
export async function broadcastQueueUpdate() {
  try {
    const io = getIO();
    const state = await buildPublicQueueState();
    io.emit('queue:updated', state);
  } catch (err) {
    console.error('[socket] broadcastQueueUpdate error:', err.message);
  }
}

/**
 * Atomically call the next eligible customer for a barber.
 * Uses a serializable transaction to prevent double-assignment.
 *
 * @param {string} barberName
 * @returns {Promise<object>} The updated QueueEntry
 */
export async function callNext(barberName) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Verify barber is on duty and available (not on break, not already busy)
      const barber = await tx.barber.findUnique({ where: { name: barberName } });
      if (!barber) throw Object.assign(new Error(`Barber "${barberName}" not found.`), { status: 404 });
      if (!barber.onDuty) throw Object.assign(new Error(`${barberName} is not on duty.`), { status: 409 });
      if (barber.status === 'ON_BREAK') throw Object.assign(new Error(`${barberName} is on break.`), { status: 409 });
      if (barber.status === 'BUSY') throw Object.assign(new Error(`${barberName} already has an active customer.`), { status: 409 });

      // 2. Find the earliest WAITING entry eligible for this barber
      //    Eligible = barberPref === barberName OR barberPref === 'ANY'
      const entry = await tx.queueEntry.findFirst({
        where: {
          status: 'WAITING',
          barberPref: { in: [barberName, 'ANY'] },
        },
        orderBy: { joinedAt: 'asc' },
        include: { services: true },
      });

      if (!entry) throw Object.assign(new Error(`No eligible customer waiting for ${barberName}.`), { status: 404 });

      // 3. Transition entry: WAITING → CALLED
      const updated = await tx.queueEntry.update({
        where: { id: entry.id },
        data: {
          status:        'CALLED',
          assignedBarber: barberName,
          calledAt:      new Date(),
        },
        include: { services: true },
      });

      // 4. Mark barber BUSY
      await tx.barber.update({
        where: { name: barberName },
        data: { status: 'BUSY' },
      });

      return updated;
    },
    { isolationLevel: 'Serializable' }
  );
}

/**
 * Start service: CALLED → IN_CHAIR
 * @param {string} barberName
 * @returns {Promise<object>}
 */
export async function startService(barberName) {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.queueEntry.findFirst({
      where: { status: 'CALLED', assignedBarber: barberName },
      include: { services: true },
    });
    if (!entry) throw Object.assign(new Error(`No called customer for ${barberName}.`), { status: 404 });

    return tx.queueEntry.update({
      where: { id: entry.id },
      data: { status: 'IN_CHAIR', startedAt: new Date() },
      include: { services: true },
    });
  });
}

/**
 * Complete service: IN_CHAIR → DONE; barber becomes AVAILABLE
 * @param {string} barberName
 * @returns {Promise<object>}
 */
export async function completeService(barberName) {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.queueEntry.findFirst({
      where: { status: 'IN_CHAIR', assignedBarber: barberName },
      include: { services: true },
    });
    if (!entry) throw Object.assign(new Error(`No in-chair customer for ${barberName}.`), { status: 404 });

    const updated = await tx.queueEntry.update({
      where: { id: entry.id },
      data: { status: 'DONE', completedAt: new Date() },
      include: { services: true },
    });

    await tx.barber.update({
      where: { name: barberName },
      data: { status: 'AVAILABLE' },
    });

    return updated;
  });
}

/**
 * Mark no-show: CALLED → NO_SHOW (only after 10 minutes)
 * @param {string} entryId
 * @returns {Promise<object>}
 */
export async function markNoShow(entryId) {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.queueEntry.findUnique({
      where: { id: entryId },
      include: { services: true },
    });
    if (!entry) throw Object.assign(new Error('Entry not found.'), { status: 404 });
    if (entry.status !== 'CALLED') throw Object.assign(new Error('Entry is not in CALLED state.'), { status: 409 });

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (!entry.calledAt || entry.calledAt > tenMinutesAgo) {
      throw Object.assign(
        new Error('No-show can only be marked at least 10 minutes after calling.'),
        { status: 409 }
      );
    }

    const updated = await tx.queueEntry.update({
      where: { id: entryId },
      data: { status: 'NO_SHOW', cancelledAt: new Date() },
      include: { services: true },
    });

    // Free the barber
    if (entry.assignedBarber) {
      await tx.barber.update({
        where: { name: entry.assignedBarber },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  });
}

/**
 * Cancel a WAITING entry (by customer or staff).
 * @param {string} entryId
 * @returns {Promise<object>}
 */
export async function cancelEntry(entryId) {
  const entry = await prisma.queueEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw Object.assign(new Error('Entry not found.'), { status: 404 });
  if (entry.status !== 'WAITING') {
    throw Object.assign(
      new Error(`Cannot cancel entry with status ${entry.status}. Only WAITING entries can be cancelled.`),
      { status: 409 }
    );
  }

  return prisma.queueEntry.update({
    where: { id: entryId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: { services: true },
  });
}

/**
 * Toggle barber break status.
 * Cannot go on break while assigned to a customer.
 * @param {string} barberName
 * @returns {Promise<object>} Updated Barber
 */
export async function toggleBreak(barberName) {
  return await prisma.$transaction(async (tx) => {
    const barber = await tx.barber.findUnique({ where: { name: barberName } });
    if (!barber) throw Object.assign(new Error(`Barber "${barberName}" not found.`), { status: 404 });
    if (!barber.onDuty) throw Object.assign(new Error(`${barberName} is not on duty.`), { status: 409 });

    if (barber.status === 'BUSY') {
      throw Object.assign(
        new Error(`${barberName} is currently assigned to a customer and cannot take a break.`),
        { status: 409 }
      );
    }

    const newStatus = barber.status === 'ON_BREAK' ? 'AVAILABLE' : 'ON_BREAK';
    return tx.barber.update({
      where: { name: barberName },
      data: { status: newStatus },
    });
  });
}
