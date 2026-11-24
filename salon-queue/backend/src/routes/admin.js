// src/routes/admin.js

import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  toggleDuty,
  getDailyStats,
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const ownerOnly = [requireAuth, requireRole('OWNER')];

router.get('/settings',              ...ownerOnly, asyncHandler(getSettings));
router.put('/settings',              ...ownerOnly, asyncHandler(updateSettings));
router.put('/barbers/:name/duty',    ...ownerOnly, asyncHandler(toggleDuty));
router.get('/stats',                 ...ownerOnly, asyncHandler(getDailyStats));

export default router;
