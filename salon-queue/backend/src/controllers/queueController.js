// src/controllers/queueController.js
// Handles all queue-entry operations: join, status, cancel, walk-in, call-next, no-show.

import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { calculateWaitTime, calculatePosition } from '../services/waitTime.js';
import {
  callNext,
  cancelEntry,
  markNoShow,
  broadcastQueueUpdate,
} from '../services/queueService.js';
import { buildReceptionQueueState } from '../services/publicState.js';
import { isOnlineJoinAllowed } from '../services/settingsService.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const BARBER_NAMES = ['Ravi', 'Amit', 'Imran', 'ANY'];

const joinSchema = z.object({
  customerName: z.string().trim().min(1, 'Name is required.'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits.'),
  serviceIds: z
    .array(z.number().int().positive())
    .min(1, 'Select at least one service.')
    .max(3, 'Maximum 3 services allowed.'),
  barberPref: z.enum(['ANY', 'Ravi', 'Amit', 'Imran']).default('ANY'),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeEntry(entry) {
  // Strip phone from public-facing responses
  const { phone, ...rest } = entry;
  return rest;
}

async function fetchEnabledServices(serviceIds) {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, enabled: true },
  });
  if (services.length !== serviceIds.length) {
    const foundIds = new Set(services.map((s) => s.id));
    const missing = serviceIds.filter((id) => !foundIds.has(id));
    throw Object.assign(
      new Error(`Service(s) not found or disabled: ${missing.join(', ')}`),
      { status: 400 }
    );
  }
  return services;
}

async function createQueueEntry({ customerName, phone, serviceIds, barberPref, isWalkin }) {
  const services = await fetchEnabledServices(serviceIds);

  // Verify barber preference is valid (not off-duty)
  if (barberPref !== 'ANY') {
    const barber = await prisma.barber.findUnique({ where: { name: barberPref } });
    if (!barber || !barber.onDuty) {
      throw Object.assign(
        new Error(`Barber "${barberPref}" is off duty. Please choose another barber or Any.`),
        { status: 409 }
      );
    }
  }

  // Create entry with service snapshots
  const entry = await prisma.queueEntry.create({
    data: {
      customerName,
      phone,
      barberPref,
      isWalkin,
      services: {
        create: services.map((s) => ({
          serviceId:   s.id,
          nameEn:      s.nameEn,
          nameGu:      s.nameGu,
          durationMin: s.durationMin,
          price:       s.price,
        })),
      },
    },
    include: { services: true },
  });

  return entry;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** GET /api/queue/summary — public */
export async function getSummary(req, res) {
  const [waitingCount, { estimateMin, overrun }, barbers, settings] = await Promise.all([
    prisma.queueEntry.count({ where: { status: 'WAITING' } }),
    calculateWaitTime({ barberPref: 'ANY' }),
    prisma.barber.findMany({ orderBy: { name: 'asc' } }),
    prisma.salonSettings.findUnique({ where: { id: 1 } }),
  ]);

  const onlineOpen = await isOnlineJoinAllowed(settings);

  res.json({
    waitingCount,
    estimateMin,
    overrun,
    onlineOpen,
    barbers,
    settings,
  });
}

/** POST /api/queue/join — public customer join */
export async function joinQueue(req, res) {
  // Validate input
  const result = joinSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }
  const { customerName, phone, serviceIds, barberPref } = result.data;

  // Check online joining is open
  const settings = await prisma.salonSettings.findUnique({ where: { id: 1 } });
  const onlineOpen = await isOnlineJoinAllowed(settings);
  if (!onlineOpen) {
    return res.status(409).json({
      error: 'Online queue joining is currently closed. Please visit the salon directly.',
    });
  }

  // Check for existing active entry with this phone
  const existing = await prisma.queueEntry.findFirst({
    where: { phone, status: { in: ['WAITING', 'CALLED', 'IN_CHAIR'] } },
    include: { services: true },
  });

  if (existing) {
    // Return existing entry details so customer can recover their link
    return res.status(409).json({
      error: 'An active queue entry already exists for this phone number.',
      recovery: {
        id:          existing.id,
        tokenNumber: existing.tokenNumber,
        status:      existing.status,
      },
    });
  }

  const entry = await createQueueEntry({ customerName, phone, serviceIds, barberPref, isWalkin: false });

  // Compute initial position and wait
  const [position, { estimateMin }] = await Promise.all([
    calculatePosition(entry.id, entry.joinedAt),
    calculateWaitTime({ barberPref }),
  ]);

  await broadcastQueueUpdate();

  return res.status(201).json({
    id:          entry.id,
    tokenNumber: entry.tokenNumber,
    position,
    estimateMin,
    statusUrl:   `/status/${entry.id}`,
  });
}

/** GET /api/queue/entry/:id — customer status (by private UUID) */
export async function getEntry(req, res) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: req.params.id },
    include: { services: true },
  });

  if (!entry) {
    return res.status(404).json({ error: 'Queue entry not found. The link may be invalid.' });
  }

  let position = null;
  let estimateMin = null;

  if (entry.status === 'WAITING') {
    [position, { estimateMin }] = await Promise.all([
      calculatePosition(entry.id, entry.joinedAt),
      calculateWaitTime({ barberPref: entry.barberPref }),
    ]);
  }

  const { phone, ...safeEntry } = entry;
  res.json({ ...safeEntry, position, estimateMin });
}

/** DELETE /api/queue/entry/:id — customer self-cancel */
export async function customerCancel(req, res) {
  const entry = await prisma.queueEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: 'Entry not found.' });
  if (entry.status !== 'WAITING') {
    return res.status(409).json({
      error: `Cannot cancel: your spot is already ${entry.status.toLowerCase().replace('_', ' ')}.`,
    });
  }

  const updated = await cancelEntry(req.params.id);
  await broadcastQueueUpdate();
  res.json({ message: 'Your spot has been cancelled.', status: updated.status });
}

/** GET /api/queue — reception/owner: full queue list */
export async function getFullQueue(req, res) {
  const state = await buildReceptionQueueState();
  res.json(state);
}

/** POST /api/queue/walkin — reception/owner: add walk-in */
export async function addWalkin(req, res) {
  const result = joinSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }
  const { customerName, phone, serviceIds, barberPref } = result.data;

  // Check for existing active entry
  const existing = await prisma.queueEntry.findFirst({
    where: { phone, status: { in: ['WAITING', 'CALLED', 'IN_CHAIR'] } },
  });
  if (existing) {
    return res.status(409).json({
      error: 'An active queue entry already exists for this phone number.',
      recovery: { id: existing.id, tokenNumber: existing.tokenNumber, status: existing.status },
    });
  }

  // Walk-ins bypass online closure but still validate services + barber pref
  const entry = await createQueueEntry({ customerName, phone, serviceIds, barberPref, isWalkin: true });

  const [position, { estimateMin }] = await Promise.all([
    calculatePosition(entry.id, entry.joinedAt),
    calculateWaitTime({ barberPref }),
  ]);

  await broadcastQueueUpdate();

  return res.status(201).json({
    id:          entry.id,
    tokenNumber: entry.tokenNumber,
    position,
    estimateMin,
    statusUrl:   `/status/${entry.id}`,
    customerName: entry.customerName,
  });
}

/** POST /api/queue/call-next — reception/owner */
export async function callNextCustomer(req, res) {
  const { barberName } = req.body;
  if (!barberName || !['Ravi', 'Amit', 'Imran'].includes(barberName)) {
    return res.status(400).json({ error: 'Valid barberName is required.' });
  }

  const entry = await callNext(barberName);
  await broadcastQueueUpdate();

  res.json({
    message:     `Called token #${entry.tokenNumber} for ${barberName}.`,
    entryId:     entry.id,
    tokenNumber: entry.tokenNumber,
    barberName,
  });
}

/** POST /api/queue/no-show/:id — reception/owner */
export async function noShow(req, res) {
  const entry = await markNoShow(req.params.id);
  await broadcastQueueUpdate();
  res.json({ message: 'Marked as no-show.', status: entry.status });
}

/** POST /api/queue/cancel/:id — reception/owner staff cancel */
export async function staffCancel(req, res) {
  const entry = await cancelEntry(req.params.id);
  await broadcastQueueUpdate();
  res.json({ message: 'Entry cancelled.', status: entry.status });
}
