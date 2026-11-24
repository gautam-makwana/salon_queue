// src/routes/barbers.js

import { Router } from 'express';
import {
  getBarbers,
  startBarber,
  doneBarber,
  breakBarber,
  getBarberCurrent,
} from '../controllers/barberController.js';
import { requireAuth, requireBarberSelf } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public
router.get('/', asyncHandler(getBarbers));

// Barber (self) or Owner
router.get('/:name/current',  requireAuth, requireBarberSelf, asyncHandler(getBarberCurrent));
router.post('/:name/start',   requireAuth, requireBarberSelf, asyncHandler(startBarber));
router.post('/:name/done',    requireAuth, requireBarberSelf, asyncHandler(doneBarber));
router.post('/:name/break',   requireAuth, requireBarberSelf, asyncHandler(breakBarber));

export default router;
