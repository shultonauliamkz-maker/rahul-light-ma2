/**
 * RAHUL LIGHT — MA FILE DOWNGRADER
 * Production Express Server
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

import { rateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Support reverse proxies (Cloudflare, Render, Railway, Nginx)
app.set('trust proxy', 1);

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware
app.use(cors());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Serve frontend static files
app.use(express.static(path.join(rootDir, 'public')));

// Catch-all route to serve index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: IS_PROD ? 'Terjadi kesalahan pada server saat memproses berkas.' : (err.message || 'Internal Server Error')
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================================`);
  console.log(`  RAHUL LIGHT — MA FILE DOWNGRADER SYSTEM ONLINE`);
  console.log(`  Target Console Support : grandMA2 v3.3.x Thru v3.9.63.6`);
  console.log(`  Local Access URL       : http://localhost:${PORT}`);
  console.log(`  Wi-Fi / LAN Access URL : http://192.168.1.4:${PORT}`);
  console.log(`==================================================================`);
});
