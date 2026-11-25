// Notificaciones push del navegador (Web Push estándar): gratis, las entrega el
// navegador del celular. Solo se necesita un par de llaves VAPID (.env.example).
import webpush from 'web-push';
import { prisma } from './db.js';

const activo = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (activo) {
  webpush.setVapidDetails(process.env.VAPID_CONTACTO || 'mailto:fuerzareal@example.com',
    process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

// Envía a todos los celulares del usuario. Una suscripción que el navegador ya
// no reconoce (404/410) se borra para no volver a intentarla.
export async function notificar(usuarioId, { titulo, cuerpo, url = '/' }) {
  if (!activo) return 0;
  const subs = await prisma.suscripcion.findMany({ where: { usuarioId } });
  let enviadas = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titulo, cuerpo, url }), { TTL: 60 * 60 * 12 });
      enviadas++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await prisma.suscripcion.delete({ where: { id: s.id } }).catch(() => {});
    }
  }));
  return enviadas;
}
