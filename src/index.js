// src/index.js

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { mountRouters } from './routes/index.js';

dotenv.config();

// ---- Setup Prisma with adapter (Prisma v7) ----
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---- Helpers ----
function parseBoolean(v, def = false) {
  if (v === undefined) return def;
  return String(v).toLowerCase() === 'true';
}

function parseOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || raw.trim() === '' || raw === '*') return '*';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---- Main Bootstrap ----
async function bootstrap() {
  const app = express();

  app.use(
    cors({
      origin: parseOrigins(),
      credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // ROUTES
  mountRouters(app, prisma);

  const port = Number(process.env.PORT) || 8888;
  app.listen(port, () => {
    console.log(`🚀 API started at http://localhost:${port}/api/`);
  });

  // Prisma cleanup
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
