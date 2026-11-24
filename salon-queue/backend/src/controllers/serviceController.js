// src/controllers/serviceController.js

import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const serviceSchema = z.object({
  nameEn:      z.string().trim().min(1, 'English name is required.'),
  nameGu:      z.string().trim().min(1, 'Gujarati name is required.'),
  durationMin: z.number().int().positive('Duration must be a positive number of minutes.'),
  price:       z.number().int().nonnegative('Price must be zero or greater.'),
  enabled:     z.boolean().optional().default(true),
});

/** GET /api/services — public: only enabled services */
export async function getEnabledServices(req, res) {
  const services = await prisma.service.findMany({
    where: { enabled: true },
    orderBy: { id: 'asc' },
  });
  res.json(services);
}

/** GET /api/services/all — owner: all services including disabled */
export async function getAllServices(req, res) {
  const services = await prisma.service.findMany({ orderBy: { id: 'asc' } });
  res.json(services);
}

/** POST /api/services — owner: add new service */
export async function createService(req, res) {
  const result = serviceSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }
  const service = await prisma.service.create({ data: result.data });
  res.status(201).json(service);
}

/** PUT /api/services/:id — owner: edit service */
export async function updateService(req, res) {
  const id = parseInt(req.params.id, 10);
  const result = serviceSchema.partial().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return res.status(404).json({ error: 'Service not found.' });

  const updated = await prisma.service.update({ where: { id }, data: result.data });
  res.json(updated);
}

/** PATCH /api/services/:id/toggle — owner: enable/disable */
export async function toggleService(req, res) {
  const id = parseInt(req.params.id, 10);
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return res.status(404).json({ error: 'Service not found.' });

  const updated = await prisma.service.update({
    where: { id },
    data: { enabled: !service.enabled },
  });
  res.json(updated);
}
