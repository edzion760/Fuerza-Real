import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from './app.js';
import { prisma } from './db.js';
import { planVisible } from './rutas.js';
import { hoyBogota } from './fecha.js';

let servidor, base;
before(async () => {
  servidor = crearApp().listen(0);
  base = `http://localhost:${servidor.address().port}/api`;
});
after(async () => { servidor.close(); await prisma.$disconnect() });

// Cliente mínimo que guarda la cookie de sesión, como haría el navegador.
function cliente() {
  let cookie = '';
  return async (metodo, ruta, cuerpo) => {
    const r = await fetch(base + ruta, { method: metodo, headers: { 'content-type': 'application/json', cookie }, body: cuerpo && JSON.stringify(cuerpo) });
    const c = r.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    return { status: r.status, body: await r.json().catch(() => null) };
  };
}
const rutina = { titulo: 'Pierna', de: 'Mar', prep: 10, ejercicios: [{ nombre: 'Sentadilla · Hack de 45°', series: 3, reps: 12, oxigenar: 60, cambio: 90, modo: 'reps' }] };

test('crear cuenta de entrenador exige el código de registro', async () => {
  const fabian = cliente();
  assert.equal((await fabian('POST', '/auth/entrenador', { codigo: 'otro', nombre: 'Fabián', celular: '3001111111', clave: 'secreta1' })).status, 403);
  const r = await fabian('POST', '/auth/entrenador', { codigo: 'FR-PRUEBA', nombre: 'Fabián Romero', celular: '300 111 1111', clave: 'secreta1' });
  assert.equal(r.status, 201);
  assert.equal(r.body.usuario.celular, '3001111111');
  assert.equal((await fabian('GET', '/auth/yo')).body.usuario.rol, 'ENTRENADOR');
});

test('el entrenador invita a un alumno, le asigna la rutina y el alumno la ve con campana', async () => {
  const fabian = cliente();
  assert.equal((await fabian('POST', '/auth/ingresar', { celular: '3001111111', clave: 'mala' })).status, 401);
  assert.equal((await fabian('POST', '/auth/ingresar', { celular: '3001111111', clave: 'secreta1' })).status, 200);
  const nuevo = await fabian('POST', '/entrenador/alumnos', { nombre: 'Edison A.', celular: '3002222222', plan: { verSemana: false, conDieta: false, recs: { dieta: 'Avena' }, semana: { 1: rutina } } });
  assert.equal(nuevo.status, 201);
  const token = nuevo.body.enlace.split('#inv=')[1];

  const edison = cliente();
  assert.equal((await edison('GET', `/auth/invitacion/${token}`)).body.entrenador, 'Fabián Romero');
  assert.equal((await edison('POST', '/auth/activar', { token, clave: 'edison1' })).status, 200);
  assert.equal((await edison('POST', '/auth/activar', { token, clave: 'edison1' })).status, 404, 'la invitación se usa una sola vez');
  assert.equal((await edison('GET', '/entrenador/alumnos')).status, 403, 'un alumno no entra a las rutas del entrenador');

  let plan = (await edison('GET', '/alumno/plan')).body;
  assert.equal(plan.asignada, null);
  assert.equal(plan.plan.semana, undefined, 'sin "toda la semana" no ve la semana');
  assert.equal(plan.plan.recs.dieta, '', 'sin dieta no ve la alimentación');

  const asig = await fabian('POST', '/entrenador/asignaciones', { alumnoIds: [nuevo.body.alumno.id], rutina });
  assert.equal(asig.status, 200);
  plan = (await edison('GET', '/alumno/plan')).body;
  assert.equal(plan.asignada.titulo, 'Pierna');
  assert.equal(plan.asignada.fecha, hoyBogota());
  assert.equal(plan.asignada.nueva, true);
  await edison('POST', '/alumno/plan/visto');
  assert.equal((await edison('GET', '/alumno/plan')).body.asignada.nueva, false);

  // A medianoche (Bogotá) la rutina deja de mostrarse.
  await prisma.usuario.update({ where: { id: nuevo.body.alumno.id }, data: { asignada: { ...rutina, fecha: '2000-01-01' } } });
  assert.equal((await edison('GET', '/alumno/plan')).body.asignada, null);

  // El alumno reporta un mareo y sus medidas; el entrenador lo ve.
  assert.equal((await edison('PUT', '/alumno/reporte', { reporte: { ficha: { talla: 'M' }, reportes: [{ tipo: 'mareo', nota: 'Al terminar' }] } })).body.avisos, 1);
  const lista = (await fabian('GET', '/entrenador/alumnos')).body.alumnos;
  assert.equal(lista[0].reporte.reportes[0].tipo, 'mareo');
  assert.equal(lista[0].activo, true);
});

test('un entrenador no ve ni toca los alumnos de otro', async () => {
  const otro = cliente();
  await otro('POST', '/auth/entrenador', { codigo: 'FR-PRUEBA', nombre: 'Otro Coach', celular: '3009999999', clave: 'secreta2' });
  assert.deepEqual((await otro('GET', '/entrenador/alumnos')).body.alumnos, []);
  const edison = await prisma.usuario.findUnique({ where: { celular: '3002222222' } });
  assert.equal((await otro('PUT', `/entrenador/alumnos/${edison.id}`, { nombre: 'Robado' })).status, 404);
  assert.equal((await otro('POST', '/entrenador/asignaciones', { alumnoIds: [edison.id], rutina })).status, 404);
});

test('planVisible respeta "toda la semana" y "con dieta"', () => {
  const p = planVisible({ verSemana: true, conDieta: true, recs: { dieta: 'Avena' }, semana: { 0: rutina } });
  assert.equal(p.recs.dieta, 'Avena');
  assert.ok(p.semana[0]);
});
