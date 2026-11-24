// src/controllers/authController.js
// POST /api/auth/login

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const staff = await prisma.staff.findUnique({ where: { username } });
  if (!staff) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(password, staff.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const payload = {
    id:         staff.id,
    username:   staff.username,
    role:       staff.role,
    barberName: staff.barberName,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

  return res.json({
    token,
    staff: payload,
  });
}
