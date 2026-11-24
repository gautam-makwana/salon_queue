// src/routes/services.js

import { Router } from 'express';
import {
  getEnabledServices,
  getAllServices,
  createService,
  updateService,
  toggleService,
} from '../controllers/serviceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public
router.get('/',          asyncHandler(getEnabledServices));

// Owner only
router.get('/all',       requireAuth, requireRole('OWNER'), asyncHandler(getAllServices));
router.post('/',         requireAuth, requireRole('OWNER'), asyncHandler(createService));
router.put('/:id',       requireAuth, requireRole('OWNER'), asyncHandler(updateService));
router.patch('/:id/toggle', requireAuth, requireRole('OWNER'), asyncHandler(toggleService));

export default router;
