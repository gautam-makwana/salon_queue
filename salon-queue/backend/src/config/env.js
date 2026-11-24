// src/config/env.js
// Validates required environment variables on startup.

import dotenv from 'dotenv';
dotenv.config();

function require_env(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`❌  Missing required environment variable: ${name}`);
    console.error(`    Copy .env.example to .env and fill in the values.`);
    process.exit(1);
  }
  return val;
}

export const env = {
  DATABASE_URL:   require_env('DATABASE_URL'),
  JWT_SECRET:     require_env('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  PORT:           parseInt(process.env.PORT || '4000', 10),
  FRONTEND_URL:   process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV:       process.env.NODE_ENV || 'development',
};
