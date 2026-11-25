import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { api } from './rutas.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function crearApp() {
  const app = express();
  // Detrás del Cloudflare Tunnel: sin esto todos los usuarios tendrían la misma IP.
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cookieParser());
  // Las rutinas viajan con las fotos de las máquinas (miniaturas de 240 px).
  app.use(express.json({ limit: '3mb' }));

  const ipReal = (req) => ipKeyGenerator(req.headers['cf-connecting-ip'] || req.ip);
  const limite = (limit) => rateLimit({ windowMs: 15 * 60 * 1000, limit, keyGenerator: ipReal, standardHeaders: true, legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' } });
  app.use('/api', limite(600));
  app.use(['/api/auth/ingresar', '/api/auth/entrenador', '/api/auth/activar'], limite(15));
  app.use('/api', api);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // El mismo proceso sirve la app (un solo archivo, index.html en la raíz del repositorio).
  app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(raiz, 'index.html')));
  return app;
}
