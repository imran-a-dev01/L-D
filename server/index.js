import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('[Setup] Created .env from .env.example — edit it to customize settings.');
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import skillRoutes from './routes/skills.js';
import dropdownRoutes from './routes/dropdowns.js';
import analyticsRoutes from './routes/analytics.js';
import masterDataRoutes from './routes/masterData.js';
import './db/seed.js'; // Ensure database & seed are initialized

const app = express();
const PORT = process.env.PORT || 81;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// Azure App Service sits behind a reverse proxy
if (isProduction) app.set('trust proxy', 1);

// CORS — in production same-origin serves both API + UI, so CORS is only needed if explicitly configured
const defaultOrigins = [];
for (let p = 5173; p <= 5185; p++) {
  defaultOrigins.push(`http://localhost:${p}`, `http://127.0.0.1:${p}`);
}
const corsOrigins = process.env.CORS_ORIGIN
  ? Array.from(new Set([...defaultOrigins, ...process.env.CORS_ORIGIN.split(',').map(s => s.trim())]))
  : defaultOrigins;

app.use(cors({
  origin: isProduction && !process.env.CORS_ORIGIN ? false : corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'SQLite (node:sqlite)', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/dropdowns', dropdownRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/master-data', masterDataRoutes);

const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback (React router URL direct refresh pannalum work aaga)
  app.get('{*path}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
  console.error('[NEXUS Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[NEXUS Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, HOST, () => {
  console.log(`[NEXUS L&D] Server running on http://localhost:${PORT} (API + Web UI)`);
});
