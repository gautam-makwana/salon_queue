// src/routes/queue.js

import { Router } from 'express';
import {
  getSummary,
  joinQueue,
  getEntry,
  customerCancel,
  getFullQueue,
  addWalkin,
  callNextCustomer,
  noShow,
  staffCancel,
} from '../controllers/queueController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/summary',       asyncHandler(getSummary));
router.post('/join',         asyncHandler(joinQueue));
router.get('/entry/:id',     asyncHandler(getEntry));
router.delete('/entry/:id',  asyncHandler(customerCancel));

// ── Staff (Reception + Owner) ─────────────────────────────────────────────────
router.get('/',              requireAuth, requireRole('RECEPTION', 'OWNER'), asyncHandler(getFullQueue));
router.post('/walkin',       requireAuth, requireRole('RECEPTION', 'OWNER'), asyncHandler(addWalkin));
router.post('/call-next',    requireAuth, requireRole('RECEPTION', 'OWNER'), asyncHandler(callNextCustomer));
router.post('/no-show/:id',  requireAuth, requireRole('RECEPTION', 'OWNER'), asyncHandler(noShow));
router.post('/cancel/:id',   requireAuth, requireRole('RECEPTION', 'OWNER'), asyncHandler(staffCancel));

export default router;
