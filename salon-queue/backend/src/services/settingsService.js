// src/services/settingsService.js
// Helpers for salon settings and time-based rules (Asia/Kolkata).

import { prisma } from '../lib/prisma.js';

const TZ = 'Asia/Kolkata';
const CUTOFF_MINUTES_BEFORE_CLOSE = 30; // online queue closes 30 min before closing

/**
 * Returns the current time in Asia/Kolkata as { hours, minutes }.
 */
export function getKolkataTime() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  const [hours, minutes] = formatted.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Parse "HH:MM" string into total minutes since midnight.
 */
function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Determines if online queue joining is currently allowed.
 * Closes 30 minutes before the salon's closing time.
 * Owner can also manually close it.
 *
 * @param {object|null} settings - SalonSettings row (fetched externally to avoid extra query)
 * @returns {Promise<boolean>}
 */
export async function isOnlineJoinAllowed(settings = null) {
  const s = settings || (await prisma.salonSettings.findUnique({ where: { id: 1 } }));
  if (!s) return false;
  if (!s.onlineQueueOpen) return false;

  const { hours, minutes } = getKolkataTime();
  const nowMins = hours * 60 + minutes;

  const closingMins = timeToMinutes(s.closingTime);
  const openingMins = timeToMinutes(s.openingTime);
  const cutoffMins  = closingMins - CUTOFF_MINUTES_BEFORE_CLOSE;

  // Before opening or after cutoff → closed
  if (nowMins < openingMins || nowMins >= cutoffMins) return false;

  return true;
}

/**
 * Returns whether the owner is allowed to reopen the queue manually.
 * Cannot reopen once inside the 30-minute cutoff window.
 */
export async function canReopenQueue() {
  const s = await prisma.salonSettings.findUnique({ where: { id: 1 } });
  if (!s) return false;

  const { hours, minutes } = getKolkataTime();
  const nowMins    = hours * 60 + minutes;
  const cutoffMins = timeToMinutes(s.closingTime) - CUTOFF_MINUTES_BEFORE_CLOSE;

  return nowMins < cutoffMins;
}
