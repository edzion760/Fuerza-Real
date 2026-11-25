import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';

// Sesión larga (180 días): en el gimnasio nadie quiere escribir la clave cada vez.
// `sv` es la versión de sesión: al cambiar la clave se sube y se cierran las demás.
const DURACION_SESION_MS = 180 * 24 * 60 * 60 * 1000;
export const COOKIE = 'fr_token';

export const soloDigitos = (celular) => String(celular ?? '').replace(/\D/g, '');
export const hashToken = (token) => createHash('sha256').update(token).digest('hex');
export const nuevoToken = () => randomBytes(24).toString('base64url');

export function ponerSesion(req, res, usuario) {
  const token = jwt.sign({ sub: usuario.id, rol: usuario.rol, sv: usuario.sesionVersion }, process.env.JWT_SECRET,
    { expiresIn: DURACION_SESION_MS / 1000 });
  res.cookie(COOKIE, token, { httpOnly: true, secure: req.secure, sameSite: 'lax', maxAge: DURACION_SESION_MS, path: '/' });
}

export async function requireAuth(req, res, next) {
  let payload;
  try { payload = jwt.verify(req.cookies?.[COOKIE] ?? '', process.env.JWT_SECRET) } catch { payload = null }
  const usuario = payload && await prisma.usuario.findUnique({ where: { id: payload.sub } });
  if (!usuario || (payload.sv ?? 0) !== usuario.sesionVersion) return res.status(401).json({ error: 'Tu sesión venció. Ingresa de nuevo.' });
  req.usuario = usuario;
  next();
}

export const requireRol = (rol) => (req, res, next) =>
  req.usuario.rol === rol ? next() : res.status(403).json({ error: 'Esta acción es solo para cuentas de ' + rol.toLowerCase() });
