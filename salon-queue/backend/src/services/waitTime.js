// src/services/waitTime.js
// Centralised wait-time estimation.
// All callers import from here — never duplicate this logic.
//
// Algorithm (from docs/03-flows-rules.md):
//   numerator   = Σ remaining minutes of CALLED/IN_CHAIR entries
//               + Σ total service minutes of WAITING entries ahead of target
//   denominator = count of on-duty barbers NOT on break (including BUSY)
//   estimate    = ceil(numerator / denominator)
//
// For a specific barber preference:
//   - denominator = 1
//   - numerator filters to entries eligible for that barber
//
// Returns null when denominator = 0 (all barbers unavailable).
// Sets overrun = true when any active entry has exceeded its service duration.

import { prisma } from '../lib/prisma.js';

/**
 * Compute remaining service minutes for a CALLED or IN_CHAIR entry.
 * Clamps to 0 if the barber is running over time.
 *
 * @param {object} entry - QueueEntry with services[] and startedAt/calledAt
 * @returns {{ remaining: number, overrun: boolean }}
 */
export function remainingMinutes(entry) {
  const totalMins = entry.services.reduce((s, svc) => s + svc.durationMin, 0);
  const startRef = entry.startedAt || entry.calledAt;
  if (!startRef) return { remaining: totalMins, overrun: false };

  const elapsedMs = Date.now() - new Date(startRef).getTime();
  const elapsedMins = elapsedMs / 60_000;
  const remaining = totalMins - elapsedMins;
  return {
    remaining: Math.max(0, remaining),
    overrun: remaining < 0,
  };
}

/**
 * Calculate wait-time estimate for the given barber preference.
 *
 * @param {object} opts
 * @param {string|null} opts.barberPref - "ANY" | barber name | null (treated as ANY)
 * @param {string|null} opts.afterEntryId - Estimate as if a new entry is appended after this entry;
 *                                           pass null to estimate for a brand-new join.
 * @returns {Promise<{ estimateMin: number|null, overrun: boolean }>}
 */
export async function calculateWaitTime({ barberPref = 'ANY', afterEntryId = null } = {}) {
  const isAny = !barberPref || barberPref === 'ANY';

  // 1. Fetch all on-duty barbers
  const allBarbers = await prisma.barber.findMany({ where: { onDuty: true } });

  // 2. Determine eligible barbers for the preference
  const eligibleBarbers = isAny
    ? allBarbers.filter((b) => b.status !== 'ON_BREAK')
    : allBarbers.filter((b) => b.name === barberPref && b.status !== 'ON_BREAK');

  if (eligibleBarbers.length === 0) {
    return { estimateMin: null, overrun: false };
  }

  const denominator = eligibleBarbers.length;
  const eligibleNames = new Set(eligibleBarbers.map((b) => b.name));

  // 3. Active (CALLED / IN_CHAIR) entries for eligible barbers
  const activeEntries = await prisma.queueEntry.findMany({
    where: {
      status: { in: ['CALLED', 'IN_CHAIR'] },
      assignedBarber: isAny ? { in: [...eligibleNames] } : barberPref,
    },
    include: { services: true },
  });

  let overrun = false;
  let activeWork = 0;
  for (const entry of activeEntries) {
    const { remaining, overrun: o } = remainingMinutes(entry);
    activeWork += remaining;
    if (o) overrun = true;
  }

  // 4. WAITING entries ahead of our virtual new join
  // "Ahead" = all WAITING entries (the new join goes to the end).
  // For specific barber, only count entries that are eligible for that barber
  // (pref === barberPref OR pref === "ANY").
  const waitingEntries = await prisma.queueEntry.findMany({
    where: {
      status: 'WAITING',
      ...(isAny
        ? {}
        : { barberPref: { in: [barberPref, 'ANY'] } }),
      // Exclude the entry itself if we are calculating position for an existing entry
      ...(afterEntryId ? { id: { not: afterEntryId } } : {}),
    },
    include: { services: true },
    orderBy: { joinedAt: 'asc' },
  });

  const waitingWork = waitingEntries.reduce(
    (sum, e) => sum + e.services.reduce((s, svc) => s + svc.durationMin, 0),
    0
  );

  const numerator = activeWork + waitingWork;
  const estimateMin = Math.ceil(numerator / denominator);

  return { estimateMin, overrun };
}

/**
 * Calculate queue position for an existing WAITING entry.
 * Position = 1 + number of WAITING entries that joined before this one.
 *
 * @param {string} entryId
 * @param {Date}   joinedAt
 * @returns {Promise<number>}
 */
export async function calculatePosition(entryId, joinedAt) {
  const ahead = await prisma.queueEntry.count({
    where: {
      status: 'WAITING',
      joinedAt: { lt: joinedAt },
      id: { not: entryId },
    },
  });
  return ahead + 1;
}
