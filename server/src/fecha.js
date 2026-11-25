// La rutina asignada vale solo el día en que se asigna, en hora de Colombia:
// a las 12 de la noche de Bogotá deja de mostrarse, sin importar la hora del servidor.
export function hoyBogota(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(ahora);
}
