// src/middleware/auth.js
// JWT verification middleware and role-based guards.

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * requireAuth — attaches req.staff = { id, username, role, barberName }
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.staff = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * requireRole(...roles) — middleware factory.
 * Must be used after requireAuth.
 * Example: router.post('/foo', requireAuth, requireRole('OWNER'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.staff) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.staff.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

/**
 * requireBarberSelf — barbers can only act on their own profile.
 * req.params.name must match req.staff.barberName (case-insensitive).
 * Owners pass through unrestricted.
 */
export function requireBarberSelf(req, res, next) {
  if (!req.staff) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.staff.role === 'OWNER') return next();
  if (req.staff.role !== 'BARBER') {
    return res.status(403).json({ error: 'Insufficient permissions.' });
  }
  if (
    !req.staff.barberName ||
    req.staff.barberName.toLowerCase() !== (req.params.name || '').toLowerCase()
  ) {
    return res.status(403).json({ error: 'You can only manage your own barber profile.' });
  }
  next();
}
