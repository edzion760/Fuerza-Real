# Servidor de Fuerza Real

Servidor para que Fuerza Real funcione con cuentas: el entrenador y cada alumno
entran con su celular y su clave, y la rutina le llega sola al celular del
alumno, sin enlaces de WhatsApp. Usa la misma tecnología que Descargo & Cargo
(Node.js, Express, Prisma, SQLite y notificaciones push), así que puede correr
en el mismo VPS sin costo adicional.

**Estado:** listo y probado por su lado (4 pruebas automáticas), pero **la app
(`index.html`) todavía no lo usa**: sigue guardando todo en el celular. Falta
conectar la app a este servidor; queda pendiente decidir si Fuerza Real sigue
como app propia o entra como complemento de Descargo & Cargo.

## Qué hace

**Cuentas**
- El entrenador crea su cuenta con un código de registro privado (`REGISTRO_CODIGO`).
- El entrenador agrega a cada alumno y recibe un enlace de invitación
  (`/#inv=...`, vale 30 días). El alumno lo abre, elige su clave y queda dentro.
  Si el alumno olvida la clave, el entrenador le genera otro enlace.
- Sesión de 180 días en una cookie segura (`httpOnly`).

**Datos** (con la misma forma que usa la app, para no convertir nada)
- `plan` del alumno: semana, recomendaciones, enfoque, "toda la semana" y "con dieta". Lo escribe el entrenador.
- `asignada`: la rutina de hoy con su fecha. Deja de mostrarse a las 12 de la noche, hora de Colombia.
- `reporte`: ficha, medidas, reloj, observaciones y reportes de dolor o mareo. Lo escribe el alumno.
- El alumno solo recibe lo que el entrenador habilitó (la semana y la dieta).

**Notificaciones push** (gratis, llaves VAPID)
- Campana al alumno cuando le asignan la rutina.
- Aviso al entrenador cuando un alumno reporta dolor, molestia o mareo.

## Rutas

| Método y ruta | Quién | Para qué |
|---|---|---|
| `POST /api/auth/entrenador` | público + código | Crear cuenta de entrenador |
| `POST /api/auth/ingresar` | público | Entrar con celular y clave |
| `POST /api/auth/salir` · `GET /api/auth/yo` | con sesión | Salir · ver quién soy |
| `GET /api/auth/invitacion/:token` · `POST /api/auth/activar` | público | Ver y aceptar una invitación |
| `GET` / `PUT /api/entrenador` | entrenador | Sus preferencias (tiempos, intervalos, alarma, WhatsApp) |
| `GET` / `POST /api/entrenador/alumnos` | entrenador | Listar y agregar alumnos |
| `PUT` / `DELETE /api/entrenador/alumnos/:id` | entrenador | Editar el plan o borrar un alumno |
| `POST /api/entrenador/alumnos/:id/invitacion` | entrenador | Nuevo enlace de invitación |
| `POST /api/entrenador/asignaciones` | entrenador | Asignar la rutina de hoy a varios alumnos |
| `GET /api/alumno/plan` · `POST /api/alumno/plan/visto` | alumno | Ver su rutina · apagar la campana |
| `PUT /api/alumno/reporte` | alumno | Enviar ficha, medidas, observaciones y reportes |
| `GET /api/push/clave` · `POST /api/push/suscribir` | con sesión | Activar notificaciones |

El mismo proceso sirve la app en `/` (el `index.html` de la raíz del repositorio).

## Probar en local

Requiere Node.js 22 o superior.

```bash
cd server
npm install
cp .env.example .env          # completar las variables
npx prisma migrate deploy     # crea la base de datos
npm run dev                   # http://localhost:4100
npm test                      # pruebas automáticas
```

## Instalar en el VPS de Descargo & Cargo

Corre como un servicio aparte, en otro puerto (4100), con su propia base de
datos. Si algo falla en Fuerza Real, Descargo & Cargo sigue funcionando.

1. Clonar el repositorio en el VPS, por ejemplo en `/opt/fuerza-real`, y dentro de `server/`:
   `npm install`, `cp .env.example .env` y completar `.env`:
   - `JWT_SECRET`: un texto largo y aleatorio, distinto al de Descargo & Cargo.
   - `REGISTRO_CODIGO`: el código que Fabián usará para crear su cuenta.
   - `APP_URL`: la dirección pública (por ejemplo `https://fuerzareal.com`).
   - Las llaves VAPID: se generan con `node -e "console.log(require('web-push').generateVAPIDKeys())"`.
2. `npx prisma migrate deploy` para crear la base de datos.
3. Crear el servicio `/etc/systemd/system/fuerza-real.service`:

   ```ini
   [Unit]
   Description=Fuerza Real
   After=network.target

   [Service]
   WorkingDirectory=/opt/fuerza-real/server
   ExecStart=/usr/bin/node src/index.js
   Restart=always
   EnvironmentFile=/opt/fuerza-real/server/.env

   [Install]
   WantedBy=multi-user.target
   ```

   y activarlo: `systemctl enable --now fuerza-real`.
4. En el Cloudflare Tunnel que ya usan, agregar el nombre del dominio de Fuerza
   Real apuntando a `http://localhost:4100`.
5. Para actualizar: `git pull`, `npx prisma migrate deploy` y `systemctl restart fuerza-real`.

**Copias de seguridad:** la base de datos es el archivo `prisma/fuerza-real.db`.
Hay que copiarlo junto con los respaldos de Descargo & Cargo.
