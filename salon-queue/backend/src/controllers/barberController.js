// src/controllers/barberController.js

import { prisma } from '../lib/prisma.js';
import { startService, completeService, toggleBreak, broadcastQueueUpdate } from '../services/queueService.js';
import { getIO } from '../lib/socket.js';

function emitBarberUpdate() {
  try {
    getIO().emit('barbers:updated', null); // clients re-fetch on this event
  } catch { /* socket may not be ready in tests */ }
}

/** GET /api/barbers — public list of all barbers + status */
export async function getBarbers(req, res) {
  const barbers = await prisma.barber.findMany({ orderBy: { name: 'asc' } });
  res.json(barbers);
}

/** POST /api/barbers/:name/start — CALLED → IN_CHAIR */
export async function startBarber(req, res) {
  const entry = await startService(req.params.name);
  await broadcastQueueUpdate();
  res.json({ message: 'Service started.', entryId: entry.id, status: entry.status });
}

/** POST /api/barbers/:name/done — IN_CHAIR → DONE */
export async function doneBarber(req, res) {
  const entry = await completeService(req.params.name);
  await broadcastQueueUpdate();
  res.json({ message: 'Service completed.', entryId: entry.id, status: entry.status });
}

/** POST /api/barbers/:name/break — toggle break (must be unassigned) */
export async function breakBarber(req, res) {
  const barber = await toggleBreak(req.params.name);
  await broadcastQueueUpdate();
  res.json({ message: `${barber.name} is now ${barber.status}.`, barber });
}

/** GET /api/barbers/:name/current — barber's current assigned entry */
export async function getBarberCurrent(req, res) {
  const { name } = req.params;
  const barber = await prisma.barber.findUnique({ where: { name } });
  if (!barber) return res.status(404).json({ error: `Barber "${name}" not found.` });

  const current = await prisma.queueEntry.findFirst({
    where: {
      assignedBarber: name,
      status: { in: ['CALLED', 'IN_CHAIR'] },
    },
    include: { services: true },
  });

  // Next eligible waiting customer for this barber (preview)
  const next = await prisma.queueEntry.findFirst({
    where: {
      status: 'WAITING',
      barberPref: { in: [name, 'ANY'] },
    },
    include: { services: true },
    orderBy: { joinedAt: 'asc' },
  });

  res.json({
    barber,
    current: current || null,
    next: next
      ? {
          tokenNumber: next.tokenNumber,
          barberPref: next.barberPref,
          services: next.services,
        }
      : null,
  });
}
