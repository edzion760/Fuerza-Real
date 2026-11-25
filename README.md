# FR Fuerza Real

App para que el coach Fabián Romero programe la rutina de cada día a sus
alumnos, presenciales o a distancia, y el alumno la siga en el celular con un
temporizador que marca el ejercicio, el tiempo para oxigenar y el cambio al
siguiente.

**Estado:** prototipo funcional en un solo archivo. Abre `index.html` en el
navegador del celular; los datos se guardan en ese navegador.

## Qué incluye

**Perfiles**
- Varios entrenadores, cada uno con su nombre, su WhatsApp, sus alumnos y
  sus temporizadores de intervalos.

**Temporizador de intervalos**
- El entrenador programa tiempo de ejercicio, tiempo de recuperación y
  cantidad de intervalos, y los guarda con un nombre (Tabata, HIIT…).
- Pantalla de fondo negro con letras rojas, pitidos y voz.

Lema: *El cuerpo es una máquina completa, ningún músculo trabaja aislado.*

**Entrenador**
- Envía la rutina del día por WhatsApp con un enlace: el alumno lo toca y la
  rutina se abre en su celular con la campana. El alumno devuelve sus datos
  (medidas, reloj, observaciones y reportes) con otro enlace.
- Filtro de dieta: la alimentación solo le aparece a los alumnos “con dieta”.
- Botón para que el alumno reporte dolor, molestia o mareo, con indicaciones
  de seguridad y aviso al coach.
- Bip en cada segundo de la cuenta regresiva (se puede apagar).
- Asigna la rutina del día a uno o varios alumnos; al alumno le suena una
  campana y la rutina se borra sola a las 12 de la noche.
- Alarma diaria para recordar asignar las rutinas (suena con la app abierta).
- Observaciones por ejercicio, de ida y vuelta entre coach y alumno.
- Ve lo que reporta cada alumno: talla, estatura, peso y perímetros, datos
  del reloj y pulso de la banda Bluetooth.
- Biblioteca de 177 ejercicios por grupo muscular (pecho, espalda, tríceps,
  bíceps, abdomen, hombro y trapecio, cadena anterior, cadena posterior, glúteo
  y pantorrilla) con sus variantes: se marcan con ✓ y se agregan a la rutina del día.
- Cada ejercicio muestra el emoticón de su grupo, la máquina y un botón para
  escuchar cómo se hace.
- Enfoque del entrenamiento con cuatro indicadores (Fuerza, Resistencia,
  Hipertrofia, Cardio). Se pueden marcar varios y cada uno dura lo que el
  coach elija: días sueltos, toda la semana o todo el mes.
- Rutina distinta por día (lunes a domingo), copiar un día a otro y asignar
  un día o la semana completa a varios alumnos.
- Por ejercicio: cómo se mide (por repeticiones o por tiempo), máquina (dibujo dorado o foto real de la máquina del
  gimnasio), series, repeticiones, tiempo de ejercicio, tiempo para oxigenar,
  descanso antes del siguiente y un mensaje de técnica.
- Recomendaciones de alimentación, complementos y profesionales.
- Aviso cuando el alumno reporta enfermedades o molestias.

**Alumno**
- Rutina del día con la máquina, el mensaje y el tiempo de cada paso.
- Pantalla de entrenamiento con cuenta regresiva, pitidos, voz y vibración.
- Video del ejercicio para enviar por WhatsApp al coach.
- Ficha con peso, estatura, medidas, IMC y datos de salud con autorización
  (Ley 1581 de 2012).

La propuesta completa del equipo (desarrollo, administración, marketing y
puntos legales) está en `PROPUESTA.md`.

© 2026 Todos los derechos reservados.

## Servidor (cuentas y envío automático)

La carpeta `server/` tiene el servidor para que la app funcione con cuentas de
entrenador y alumno. Está listo y probado, pero la app aún no lo usa. Ver
`server/README.md`.
