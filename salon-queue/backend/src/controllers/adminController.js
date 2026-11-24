// src/controllers/adminController.js

import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { canReopenQueue, getKolkataTime } from '../services/settingsService.js';
import { broadcastQueueUpdate } from '../services/queueService.js';
import { getIO } from '../lib/socket.js';

// ── Settings ──────────────────────────────────────────────────────────────────

/** GET /api/admin/settings */
export async function getSettings(req, res) {
  const settings = await prisma.salonSettings.findUnique({ where: { id: 1 } });
  const canReopen = await canReopenQueue();
  res.json({ ...settings, canReopenQueue: canReopen });
}

const settingsSchema = z.object({
  onlineQueueOpen: z.boolean().optional(),
  closingTime:     z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format.').optional(),
  openingTime:     z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format.').optional(),
});

/** PUT /api/admin/settings */
export async function updateSettings(req, res) {
  const result = settingsSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const data = result.data;

  // Cannot reopen online queue during cutoff window
  if (data.onlineQueueOpen === true) {
    const canReopen = await canReopenQueue();
    if (!canReopen) {
      return res.status(409).json({
        error: 'Online queue cannot be reopened during the 30-minute closing cutoff window.',
      });
    }
  }

  const updated = await prisma.salonSettings.update({ where: { id: 1 }, data });

  try { getIO().emit('settings:updated', updated); } catch { /* ok */ }

  res.json(updated);
}

// ── Barber Duty ───────────────────────────────────────────────────────────────

/** PUT /api/admin/barbers/:name/duty — toggle on-duty */
export async function toggleDuty(req, res) {
  const { name } = req.params;
  const barber = await prisma.barber.findUnique({ where: { name } });
  if (!barber) return res.status(404).json({ error: `Barber "${name}" not found.` });

  if (barber.onDuty) {
    // Trying to take off duty — check constraints
    const assigned = await prisma.queueEntry.findFirst({
      where: { assignedBarber: name, status: { in: ['CALLED', 'IN_CHAIR'] } },
    });
    if (assigned) {
      return res.status(409).json({
        error: `${name} is currently assigned to customer #${assigned.tokenNumber} and cannot be taken off duty.`,
      });
    }

    const requested = await prisma.queueEntry.findFirst({
      where: { barberPref: name, status: 'WAITING' },
    });
    if (requested) {
      return res.status(409).json({
        error: `${name} has customers specifically waiting for them (token #${requested.tokenNumber}). Cannot take off duty while they are waiting.`,
      });
    }
  }

  const newDuty = !barber.onDuty;
  const newStatus = newDuty ? 'AVAILABLE' : 'OFF_DUTY';

  const updated = await prisma.barber.update({
    where: { name },
    data: { onDuty: newDuty, status: newStatus },
  });

  await broadcastQueueUpdate();
  res.json(updated);
}

// ── Daily Stats ───────────────────────────────────────────────────────────────

/** GET /api/admin/stats — daily stats in Asia/Kolkata day */
export async function getDailyStats(req, res) {
  // Get today's date range in Asia/Kolkata
  const now = new Date();
  const kolkataFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const todayStr = kolkataFormatter.format(now); // YYYY-MM-DD

  // Build UTC boundaries for today in Kolkata (+05:30)
  const startOfDayKolkata = new Date(`${todayStr}T00:00:00+05:30`);
  const endOfDayKolkata   = new Date(`${todayStr}T23:59:59.999+05:30`);

  const [doneEntries, noShowEntries] = await Promise.all([
    prisma.queueEntry.findMany({
      where: {
        status:      'DONE',
        completedAt: { gte: startOfDayKolkata, lte: endOfDayKolkata },
      },
      include: { services: true },
    }),
    prisma.queueEntry.count({
      where: {
        status:      'NO_SHOW',
        cancelledAt: { gte: startOfDayKolkata, lte: endOfDayKolkata },
      },
    }),
  ]);

  const completedCount = doneEntries.length;
  const noShowCount    = noShowEntries;

  // Average wait = average minutes from joinedAt to startedAt
  let averageWaitMin = null;
  if (completedCount > 0) {
    const totalWaitMs = doneEntries.reduce((sum, e) => {
      if (e.startedAt && e.joinedAt) {
        return sum + (new Date(e.startedAt) - new Date(e.joinedAt));
      }
      return sum;
    }, 0);
    averageWaitMin = Math.round(totalWaitMs / completedCount / 60_000);
  }

  res.json({
    date: todayStr,
    completedCount,
    noShowCount,
    averageWaitMin,
  });
}
