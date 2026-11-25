import 'dotenv/config';
import { crearApp } from './app.js';

const puerto = Number(process.env.PORT) || 4100;
crearApp().listen(puerto, () => console.log(`Fuerza Real escuchando en http://localhost:${puerto}`));
