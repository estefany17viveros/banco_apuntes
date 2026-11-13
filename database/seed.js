/**
 * Datos iniciales.
 *   npm run seed          -> crea lo que falte (programas, materias, metodologías, usuarios demo, apuntes de ejemplo)
 *   npm run seed:reset    -> BORRA las colecciones de la app y las crea de nuevo (recomendado la primera vez)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const conectarDB = require('../config/db');
const Usuario = require('../models/Usuario');
const Programa = require('../models/Programa');
const Materia = require('../models/Materia');
const Metodologia = require('../models/Metodologia');
const Apunte = require('../models/Apunte');
const Calificacion = require('../models/Calificacion');
const { refrescarEstadisticas } = require('../utils/apunteDto');

const COLECCIONES = [
  'apuntes', 'archivos', 'calificaciones', 'calificacions', 'comentarios', 'favoritos',
  'reportes', 'notificaciones', 'materias', 'metodologias', 'programas', 'usuarios'
];

const PROGRAMAS = [
  { nombre: 'Ingeniería de Sistemas', codigo: 'ISIS', materias: [
    ['Bases de Datos II', 5], ['Estructuras de Datos', 3], ['Ingeniería de Software', 6], ['Redes de Computadores', 6], ['Seguridad Informática', 8]
  ] },
  { nombre: 'Administración de Empresas', codigo: 'ADM', materias: [
    ['Contabilidad General', 2], ['Marketing', 4], ['Finanzas Corporativas', 6]
  ] },
  { nombre: 'Derecho', codigo: 'DER', materias: [
    ['Derecho Constitucional', 2], ['Derecho Civil', 4]
  ] }
];

const METODOLOGIAS = [
  ['Resumen', 'Síntesis de los puntos principales de un tema.'],
  ['Método Cornell', 'Notas divididas en ideas clave, apuntes y resumen.'],
  ['Mapa mental', 'Esquema visual con ideas conectadas.'],
  ['Esquema / Outline', 'Jerarquía de títulos y subtítulos.'],
  ['Fichas de estudio', 'Preguntas y respuestas para repasar.']
];

(async () => {
  await conectarDB();
  const db = mongoose.connection.db;

  if (process.argv.includes('--reset')) {
    const existentes = (await db.listCollections().toArray()).map((c) => c.name);
    for (const nombre of COLECCIONES.filter((n) => existentes.includes(n))) {
      await db.dropCollection(nombre);
      console.log(`🗑️  Colección eliminada: ${nombre}`);
    }
  }

  // Asegura índices (únicos) de todos los modelos
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));

  // Programas y materias
  const mapaMaterias = {};
  for (const p of PROGRAMAS) {
    const prog = await Programa.findOneAndUpdate({ nombre: p.nombre }, { nombre: p.nombre, codigo: p.codigo }, { upsert: true, new: true });
    for (const [nombre, semestre] of p.materias) {
      const m = await Materia.findOneAndUpdate({ programa_id: prog._id, nombre }, { programa_id: prog._id, nombre, semestre }, { upsert: true, new: true });
      mapaMaterias[nombre] = { programa: prog, materia: m };
    }
  }
  console.log('✅ Programas y materias listos');

  const metodos = {};
  for (const [nombre, descripcion] of METODOLOGIAS) {
    metodos[nombre] = await Metodologia.findOneAndUpdate({ nombre }, { nombre, descripcion }, { upsert: true, new: true });
  }
  console.log('✅ Metodologías listas');

  // Usuarios demo (la contraseña se encripta con el hook del modelo)
  const crearUsuario = async (datos) => {
    let u = await Usuario.findOne({ email: datos.email });
    if (!u) u = await Usuario.create(datos);
    return u;
  };
  const admin = await crearUsuario({ nombre: 'Administrador', email: 'admin@unicauca.edu.co', password: 'Admin123*', rol: 'admin' });
  const maria = await crearUsuario({ nombre: 'María López', email: 'maria@unicauca.edu.co', password: 'Estudiante123*', programa_id: mapaMaterias['Bases de Datos II'].programa._id });
  const juan = await crearUsuario({ nombre: 'Juan Pérez', email: 'juan@unicauca.edu.co', password: 'Estudiante123*', programa_id: mapaMaterias['Marketing'].programa._id });
  console.log('✅ Usuarios demo listos');

  // Apuntes de ejemplo (solo si no hay ninguno)
  if ((await Apunte.countDocuments()) === 0) {
    const ejemplos = [
      {
        titulo: 'Normalización de Bases de Datos (1FN a 3FN)', autor: maria, m: 'Bases de Datos II', metodo: 'Resumen',
        etiquetas: ['normalización', 'sql', 'parcial'],
        contenido: 'La normalización organiza los datos para reducir la redundancia.\n\n1FN: valores atómicos, sin grupos repetidos.\n2FN: 1FN + sin dependencias parciales de la clave.\n3FN: 2FN + sin dependencias transitivas.\n\nTip: antes de normalizar identifica las dependencias funcionales.'
      },
      {
        titulo: 'Árboles binarios y recorridos', autor: maria, m: 'Estructuras de Datos', metodo: 'Esquema / Outline',
        etiquetas: ['árboles', 'recorridos'],
        contenido: 'Recorridos en profundidad:\n- Preorden: raíz, izquierda, derecha\n- Inorden: izquierda, raíz, derecha\n- Postorden: izquierda, derecha, raíz\n\nRecorrido en anchura: por niveles usando una cola.'
      },
      {
        titulo: 'Las 4P del Marketing', autor: juan, m: 'Marketing', metodo: 'Mapa mental',
        etiquetas: ['marketing', 'mezcla'],
        contenido: 'Producto, Precio, Plaza y Promoción.\n\nProducto: necesidades que satisface y ciclo de vida.\nPrecio: costos, competencia y valor percibido.\nPlaza: canales de distribución.\nPromoción: publicidad, relaciones públicas y ventas.'
      }
    ];
    for (const e of ejemplos) {
      const { programa, materia } = mapaMaterias[e.m];
      const a = await Apunte.create({
        titulo: e.titulo, contenido: e.contenido, etiquetas: e.etiquetas, autor_id: e.autor._id,
        programa_id: programa._id, materia_id: materia._id, metodologia_id: metodos[e.metodo]._id, estado: 'publicado'
      });
      // Calificaciones de ejemplo
      await Calificacion.create({ apunte_id: a._id, usuario_id: admin._id, puntuacion: 5 });
      if (e.autor._id.toString() === maria._id.toString()) await Calificacion.create({ apunte_id: a._id, usuario_id: juan._id, puntuacion: 4 });
      await refrescarEstadisticas(a._id);
    }
    console.log('✅ Apuntes de ejemplo creados');
  }

  console.log('\n🎉 Listo. Cuentas de prueba:');
  console.log('   Admin:      admin@unicauca.edu.co / Admin123*');
  console.log('   Estudiante: maria@unicauca.edu.co / Estudiante123*');
  console.log('   Estudiante: juan@unicauca.edu.co  / Estudiante123*');
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('❌ Error en el seed:', e.message);
  await mongoose.disconnect();
  process.exit(1);
});
