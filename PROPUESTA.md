# FR Fuerza Real — propuesta inicial

App para que un entrenador (Fabián) programe la rutina semanal de cada alumno,
presencial o a distancia, y el alumno la siga en su celular con un temporizador
que le marca cuándo hacer el ejercicio, cuándo oxigenar y cuándo pasar al
siguiente. Además lleva la dieta, los complementos y los profesionales que el
entrenador recomienda.

El prototipo funcional está en `index.html` (ábrelo en el navegador del celular).
Estilo visual: negro con filetes dorados.
Marca elegida: **FR Fuerza Real** (FR = Fabián Romero), slogan "Resultados reales". Logo: silueta de un color hecha con la foto de Fabián (no se sube al repositorio por ser público).

## Qué hace el prototipo

**Entrenador**
- Crea alumnos y les arma una rutina distinta para cada día de la semana (Lun a Dom).
- Por cada ejercicio elige la máquina (dibujo dorado de 12 equipos: banco, rack,
  prensa, polea, mancuernas, barra, paralelas, dominadas, bicicleta, colchoneta…)
  o sube la foto real de la máquina de su gimnasio. Define también: series, repeticiones, tiempo de ejercicio,
  tiempo para oxigenar entre series, tiempo para oxigenar antes del siguiente
  ejercicio y un mensaje (técnica, respiración, peso sugerido).
- Tiempo de ejercicio en 0 = ejercicio por repeticiones: el alumno toca
  "Terminé la serie" cuando acaba.
- Copia un día a otro (útil para quien entrena los 7 días).
- Asigna la misma rutina (un día o la semana completa) a varios alumnos a la
  vez; después puede ajustar a cada uno por separado.
- Ve un aviso "Revisar antes de programar" cuando el alumno reporta
  enfermedades o molestias.
- Escribe recomendaciones: alimentación, complemento y profesional (fisioterapeuta,
  quiropráctico, nutricionista).
- Envía la rutina como un código que el alumno pega (en la app real llega sola).

**Alumno**
- Ve la rutina de hoy como una lista de iconos uno debajo del otro, con el
  mensaje al frente y el tiempo de cada paso.
- Pantalla de entrenamiento: cuenta regresiva grande con color por fase
  (naranja ejercicio, verde agua oxigenar, ámbar transición), pitidos en los
  últimos 3 segundos, vibración, voz que anuncia el ejercicio y la serie, y la
  pantalla no se apaga.
- Pausa, atrás, +10 s y "qué sigue".
- Graba un video del ejercicio con la cámara del celular y lo envía por
  WhatsApp al entrenador para que corrija la técnica.
- Llena su ficha: peso, estatura, medidas (pecho, cintura, cadera, brazo,
  pierna) con historial e IMC, y, si autoriza, enfermedades y molestias.

## Conexión con relojes y apps de salud
- **Google Health Connect (Android) y Apple Salud (iPhone)** reúnen pasos,
  calorías, ritmo cardiaco y sueño de casi todos los relojes y apps (Samsung
  Health, Xiaomi/Mi Fitness, Huawei, Garmin, Fitbit). Leerlos exige una app
  nativa: la app Android actual (TWA) no puede, así que se pasaría a
  Capacitor o React Native. Es la vía que cubre a más alumnos.
- **Garmin, Fitbit, Polar y Strava** tienen conexión por internet (el alumno
  autoriza su cuenta una vez) y funcionan sin app nativa.
- **Bandas de pecho Bluetooth** (Polar H10, Garmin HRM): en Android con Chrome
  la app web puede leer el ritmo cardiaco en vivo y mostrarlo junto al
  temporizador.
- Recomendación: fase 2, empezando por Health Connect y Apple Salud.

## Mirada del equipo

### Programador senior (desarrollo para gimnasios)
- **MVP en 6–8 semanas** reutilizando lo que ya funciona en Descargo & Cargo:
  React + Vite (PWA), Node/Express + Prisma, pagos con Wompi y app Android como
  TWA. Mismo servidor, otro dominio.
- Modelo de datos: `Entrenador` → `Alumno` → `Plan` (semana) → `Dia` →
  `Ejercicio` (series, reps, segundos, descansos, mensaje), más `Registro`
  (lo que el alumno hizo: fecha, series completadas, peso usado).
- El temporizador debe funcionar **sin internet** (el gimnasio suele tener mala
  señal): la rutina se descarga al abrir la app y se guarda en el celular.
- Biblioteca de ejercicios del entrenador para no escribir lo mismo cada vez,
  con video corto o GIF de la técnica (fase 2).
- Riesgo técnico: en iPhone los pitidos y la voz pueden silenciarse con la
  pantalla bloqueada; por eso se mantiene la pantalla encendida.

### Administrador de gimnasio
- Lo que más pesa en el día a día: **saber quién entrenó y quién está por
  abandonar**. El alumno marca la rutina como hecha y el entrenador ve un
  semáforo (verde: entrena, amarillo: 3 días sin entrenar, rojo: una semana).
- **Cobro de la mensualidad** dentro de la app (Nequi, PSE, tarjeta) con
  recordatorio automático y bloqueo suave de la rutina nueva si no ha pagado.
- Fichas del alumno: medidas, peso, fotos de progreso, lesiones y
  restricciones médicas (que el entrenador vea antes de programar).
- Plantillas: el entrenador arma "Hipertrofia principiante" una vez y la asigna
  a 20 alumnos, ajustando solo lo necesario.
- Versión para gimnasios: varios entrenadores bajo una sede, con reporte de
  asistencia y retención.

### Gerente de marketing (merchandising)
- **Modelo de negocio**: suscripción del entrenador según número de alumnos
  (el alumno usa la app gratis). Primeros 5 alumnos gratis para enganchar.
- **Marca del entrenador**: la app muestra el logo y colores de Fabián
  ("Team Fabián"), así la vende como su propio servicio premium.
- **Merchandising**: camisetas, toallas y termos con el QR que abre la rutina
  del día; kit de bienvenida para alumnos nuevos; el QR también en el gimnasio.
- **Complementos y profesionales**: catálogo de productos y directorio de
  fisioterapeutas y quiroprácticos aliados con código de descuento; el
  entrenador gana comisión por referido. Es una segunda fuente de ingreso sin
  inventario.
- Contenido para redes: cada rutina terminada genera una tarjeta para
  compartir en Instagram ("Día 30 con Team Fabián"), que hace publicidad gratis.

## Puntos legales a cuidar (Colombia)
- Los datos de salud (lesiones, medidas, condiciones médicas) son **datos
  sensibles** bajo la Ley 1581 de 2012: autorización expresa y separada, y
  opción de no darlos.
- Los complementos se recomiendan como sugerencia del entrenador, sin prometer
  curas ni resultados médicos, y solo productos con registro INVIMA.
- La app no reemplaza la valoración médica; decirlo en los Términos y en la
  pantalla de recomendaciones.

## Siguientes pasos sugeridos
1. Probar el prototipo con Fabián y 3–5 de sus alumnos durante una semana.
2. Anotar qué le falta al entrenador para programar en menos de 5 minutos por alumno.
3. Definir precio con Fabián y otros 2–3 entrenadores.
4. Construir el MVP: cuentas, rutinas en la nube, temporizador sin conexión,
   registro de entrenamientos y cobro de mensualidad.
