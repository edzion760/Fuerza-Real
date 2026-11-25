import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './db.js';
import { COOKIE, hashToken, nuevoToken, ponerSesion, requireAuth, requireRol, soloDigitos } from './auth.js';
import { hoyBogota } from './fecha.js';
import { notificar } from './push.js';

export const api = Router();

const INVITACION_DIAS = 30;
const celular = z.string().transform(soloDigitos).pipe(z.string().min(7, 'Número de celular inválido').max(15));
const clave = z.string().min(6, 'La clave debe tener al menos 6 caracteres').max(100);
const nombre = z.string().trim().min(2, 'Escribe el nombre').max(80);
const json = z.record(z.any());

function validar(esquema, datos, res) {
  const r = esquema.safeParse(datos);
  if (!r.success) { res.status(400).json({ error: r.error.issues[0].message }); return null }
  return r.data;
}
const publico = (u) => ({ id: u.id, rol: u.rol, nombre: u.nombre, celular: u.celular });
const enlaceInvitacion = (token) => `${process.env.APP_URL ?? ''}/#inv=${token}`;

// ---------- Cuentas ----------
api.post('/auth/entrenador', async (req, res) => {
  const d = validar(z.object({ codigo: z.string(), nombre, celular, clave }), req.body, res);
  if (!d) return;
  if (!process.env.REGISTRO_CODIGO || d.codigo !== process.env.REGISTRO_CODIGO) return res.status(403).json({ error: 'El código de registro no es correcto.' });
  if (await prisma.usuario.findUnique({ where: { celular: d.celular } })) return res.status(409).json({ error: 'Ya existe una cuenta con ese celular.' });
  const u = await prisma.usuario.create({ data: { rol: 'ENTRENADOR', nombre: d.nombre, celular: d.celular, claveHash: await bcrypt.hash(d.clave, 10) } });
  ponerSesion(req, res, u);
  res.status(201).json({ usuario: publico(u) });
});

api.post('/auth/ingresar', async (req, res) => {
  const d = validar(z.object({ celular, clave: z.string() }), req.body, res);
  if (!d) return;
  const u = await prisma.usuario.findUnique({ where: { celular: d.celular } });
  if (!u?.claveHash || !(await bcrypt.compare(d.clave, u.claveHash))) return res.status(401).json({ error: 'Celular o clave incorrectos.' });
  ponerSesion(req, res, u);
  res.json({ usuario: publico(u) });
});

api.post('/auth/salir', (_req, res) => { res.clearCookie(COOKIE, { path: '/' }); res.json({ ok: true }) });

api.get('/auth/yo', requireAuth, (req, res) => res.json({ usuario: publico(req.usuario) }));

// El alumno abre el enlace que le mandó su entrenador y elige su clave.
api.get('/auth/invitacion/:token', async (req, res) => {
  const u = await prisma.usuario.findUnique({ where: { invitacionHash: hashToken(req.params.token) }, include: { entrenador: true } });
  if (!u || u.invitacionVence < new Date()) return res.status(404).json({ error: 'La invitación no existe o ya venció. Pídele a tu entrenador una nueva.' });
  res.json({ nombre: u.nombre, entrenador: u.entrenador?.nombre });
});

api.post('/auth/activar', async (req, res) => {
  const d = validar(z.object({ token: z.string(), clave }), req.body, res);
  if (!d) return;
  const u = await prisma.usuario.findUnique({ where: { invitacionHash: hashToken(d.token) } });
  if (!u || u.invitacionVence < new Date()) return res.status(404).json({ error: 'La invitación no existe o ya venció. Pídele a tu entrenador una nueva.' });
  const listo = await prisma.usuario.update({ where: { id: u.id },
    data: { claveHash: await bcrypt.hash(d.clave, 10), invitacionHash: null, invitacionVence: null, sesionVersion: { increment: 1 } } });
  ponerSesion(req, res, listo);
  res.json({ usuario: publico(listo) });
});

// ---------- Entrenador ----------
const entrenador = Router();
entrenador.use(requireAuth, requireRol('ENTRENADOR'));
api.use('/entrenador', entrenador);

const vistaAlumno = (a) => ({ ...publico(a), activo: Boolean(a.claveHash), plan: a.plan, asignada: a.asignada, reporte: a.reporte });
async function alumnoPropio(req, res) {
  const a = await prisma.usuario.findFirst({ where: { id: req.params.id, entrenadorId: req.usuario.id } });
  if (!a) res.status(404).json({ error: 'Ese alumno no existe en tu lista.' });
  return a;
}

entrenador.get('/', (req, res) => res.json({ usuario: publico(req.usuario), datos: req.usuario.datos ?? {} }));
entrenador.put('/', async (req, res) => {
  const d = validar(z.object({ datos: json }), req.body, res);
  if (!d) return;
  const u = await prisma.usuario.update({ where: { id: req.usuario.id }, data: { datos: d.datos } });
  res.json({ datos: u.datos });
});

entrenador.get('/alumnos', async (req, res) => {
  const lista = await prisma.usuario.findMany({ where: { entrenadorId: req.usuario.id }, orderBy: { creadoEn: 'asc' } });
  res.json({ alumnos: lista.map(vistaAlumno) });
});

entrenador.post('/alumnos', async (req, res) => {
  const d = validar(z.object({ nombre, celular, plan: json.optional() }), req.body, res);
  if (!d) return;
  if (await prisma.usuario.findUnique({ where: { celular: d.celular } })) return res.status(409).json({ error: 'Ya existe una cuenta con ese celular.' });
  const token = nuevoToken();
  const a = await prisma.usuario.create({ data: { rol: 'ALUMNO', nombre: d.nombre, celular: d.celular, entrenadorId: req.usuario.id, plan: d.plan ?? {},
    invitacionHash: hashToken(token), invitacionVence: new Date(Date.now() + INVITACION_DIAS * 864e5) } });
  res.status(201).json({ alumno: vistaAlumno(a), enlace: enlaceInvitacion(token) });
});

// Nuevo enlace de invitación (si el anterior se perdió o venció). Si el alumno ya
// tenía clave, el enlace le permite elegir una nueva: sirve como "olvidé mi clave".
entrenador.post('/alumnos/:id/invitacion', async (req, res) => {
  const a = await alumnoPropio(req, res);
  if (!a) return;
  const token = nuevoToken();
  await prisma.usuario.update({ where: { id: a.id }, data: { invitacionHash: hashToken(token), invitacionVence: new Date(Date.now() + INVITACION_DIAS * 864e5) } });
  res.json({ enlace: enlaceInvitacion(token) });
});

entrenador.put('/alumnos/:id', async (req, res) => {
  const d = validar(z.object({ nombre: nombre.optional(), plan: json.optional() }), req.body, res);
  if (!d || !(await alumnoPropio(req, res))) return;
  const a = await prisma.usuario.update({ where: { id: req.params.id }, data: d });
  res.json({ alumno: vistaAlumno(a) });
});

entrenador.delete('/alumnos/:id', async (req, res) => {
  if (!(await alumnoPropio(req, res))) return;
  await prisma.usuario.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Asigna la rutina de hoy a uno o varios alumnos y les suena la campana en el celular.
entrenador.post('/asignaciones', async (req, res) => {
  const d = validar(z.object({ alumnoIds: z.array(z.string()).min(1, 'Elige al menos un alumno'),
    rutina: z.object({ titulo: z.string().max(120).optional(), de: z.string().max(10).optional(), prep: z.number().optional(), ejercicios: z.array(json).min(1, 'La rutina no tiene ejercicios') }) }), req.body, res);
  if (!d) return;
  const alumnos = await prisma.usuario.findMany({ where: { id: { in: d.alumnoIds }, entrenadorId: req.usuario.id } });
  if (alumnos.length !== d.alumnoIds.length) return res.status(404).json({ error: 'Alguno de esos alumnos no está en tu lista.' });
  const asignada = { ...d.rutina, fecha: hoyBogota(), nueva: true };
  await prisma.usuario.updateMany({ where: { id: { in: d.alumnoIds } }, data: { asignada } });
  let avisados = 0;
  for (const a of alumnos) {
    avisados += await notificar(a.id, { titulo: '🔔 Te llegó la rutina de hoy', cuerpo: `${d.rutina.titulo || 'Rutina'} · de ${req.usuario.nombre}` }) ? 1 : 0;
  }
  res.json({ asignados: alumnos.length, avisados, fecha: asignada.fecha });
});

// ---------- Alumno ----------
const alumno = Router();
alumno.use(requireAuth, requireRol('ALUMNO'));
api.use('/alumno', alumno);

// Solo lo que el entrenador habilitó: la semana si marcó "toda la semana",
// la dieta si el alumno está "con dieta", y la rutina asignada si es de hoy.
export function planVisible(plan = {}) {
  const { semana, recs = {}, ...resto } = plan ?? {};
  return { ...resto, recs: { ...recs, dieta: resto.conDieta ? recs.dieta : '' }, ...(resto.verSemana ? { semana } : {}) };
}

alumno.get('/plan', async (req, res) => {
  const e = await prisma.usuario.findUnique({ where: { id: req.usuario.entrenadorId } });
  const a = req.usuario;
  res.json({
    usuario: publico(a),
    entrenador: e && { nombre: e.nombre, tel: e.datos?.tel || e.celular },
    plan: planVisible(a.plan),
    asignada: a.asignada?.fecha === hoyBogota() ? a.asignada : null,
    reporte: a.reporte ?? {},
  });
});

// La campana suena una sola vez: el alumno la apaga al abrir la rutina.
alumno.post('/plan/visto', async (req, res) => {
  if (req.usuario.asignada) await prisma.usuario.update({ where: { id: req.usuario.id }, data: { asignada: { ...req.usuario.asignada, nueva: false } } });
  res.json({ ok: true });
});

// Ficha, medidas, reloj, observaciones y reportes. Un reporte nuevo de dolor,
// molestia o mareo le llega al entrenador como notificación.
const SOS = { dolor: '🤕 dolor', molestia: '😣 molestia', mareo: '😵 mareo', otro: '❓ un problema' };
alumno.put('/reporte', async (req, res) => {
  const d = validar(z.object({ reporte: json }), req.body, res);
  if (!d) return;
  const antes = (req.usuario.reporte?.reportes ?? []).length, nuevos = (d.reporte.reportes ?? []).slice(antes);
  await prisma.usuario.update({ where: { id: req.usuario.id }, data: { reporte: d.reporte } });
  for (const r of nuevos) {
    await notificar(req.usuario.entrenadorId, { titulo: `🆘 ${req.usuario.nombre} reporta ${SOS[r.tipo] ?? 'un problema'}`, cuerpo: [r.ejercicio, r.nota].filter(Boolean).join(' · ') });
  }
  res.json({ ok: true, avisos: nuevos.length });
});

// ---------- Notificaciones ----------
api.get('/push/clave', (_req, res) => res.json({ clave: process.env.VAPID_PUBLIC_KEY ?? null }));
api.post('/push/suscribir', requireAuth, async (req, res) => {
  const d = validar(z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string(), auth: z.string() }) }), req.body, res);
  if (!d) return;
  await prisma.suscripcion.upsert({ where: { endpoint: d.endpoint },
    create: { usuarioId: req.usuario.id, endpoint: d.endpoint, p256dh: d.keys.p256dh, auth: d.keys.auth },
    update: { usuarioId: req.usuario.id, p256dh: d.keys.p256dh, auth: d.keys.auth } });
  res.json({ ok: true });
});
