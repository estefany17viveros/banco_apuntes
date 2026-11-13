const Archivo = require('../models/Archivo');
const Favorito = require('../models/Favorito');
const Calificacion = require('../models/Calificacion');
const Comentario = require('../models/Comentario');

// Campos que se traen de las referencias.
const POPULATE = [
  { path: 'autor_id', select: 'nombre' },
  { path: 'programa_id', select: 'nombre codigo' },
  { path: 'materia_id', select: 'nombre' },
  { path: 'metodologia_id', select: 'nombre' }
];

const refDto = (r) => (r && r._id ? { _id: r._id, nombre: r.nombre, codigo: r.codigo } : null);

const archivoDto = (a) => ({
  _id: a._id,
  nombre: a.nombre_original,
  mimetype: a.mimetype,
  tamano: a.tamano,
  url: a.url
});

function apunteDto(a, archivos = [], extra = {}) {
  const o = a.toObject ? a.toObject() : a;
  return {
    _id: o._id,
    titulo: o.titulo,
    contenido: o.contenido,
    etiquetas: o.etiquetas || [],
    estado: o.estado,
    promedio: o.promedio || 0,
    num_calificaciones: o.num_calificaciones || 0,
    num_favoritos: o.num_favoritos || 0,
    num_comentarios: o.num_comentarios || 0,
    vistas: o.vistas || 0,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    autor: refDto(o.autor_id),
    programa: refDto(o.programa_id),
    materia: refDto(o.materia_id),
    metodologia: refDto(o.metodologia_id),
    archivos: archivos.map(archivoDto),
    ...extra
  };
}

// Agrega archivos + "es_favorito" y "mi_calificacion" del usuario que consulta.
async function enriquecer(apuntes, usuarioId) {
  const ids = apuntes.map((a) => a._id);
  const [archivos, favs, califs] = await Promise.all([
    Archivo.find({ apunte_id: { $in: ids } }).sort({ createdAt: 1 }),
    usuarioId ? Favorito.find({ usuario_id: usuarioId, apunte_id: { $in: ids } }) : [],
    usuarioId ? Calificacion.find({ usuario_id: usuarioId, apunte_id: { $in: ids } }) : []
  ]);

  const porApunte = new Map();
  archivos.forEach((f) => {
    const k = String(f.apunte_id);
    if (!porApunte.has(k)) porApunte.set(k, []);
    porApunte.get(k).push(f);
  });
  const favSet = new Set(favs.map((f) => String(f.apunte_id)));
  const califMap = new Map(califs.map((c) => [String(c.apunte_id), c.puntuacion]));

  return apuntes.map((a) =>
    apunteDto(a, porApunte.get(String(a._id)) || [], {
      es_favorito: favSet.has(String(a._id)),
      mi_calificacion: califMap.get(String(a._id)) || 0
    })
  );
}

// Recalcula promedio, favoritos y comentarios de un apunte.
async function refrescarEstadisticas(apunteId) {
  const Apunte = require('../models/Apunte');
  const [agg, favs, coms] = await Promise.all([
    Calificacion.aggregate([
      { $match: { apunte_id: apunteId } },
      { $group: { _id: '$apunte_id', promedio: { $avg: '$puntuacion' }, total: { $sum: 1 } } }
    ]),
    Favorito.countDocuments({ apunte_id: apunteId }),
    Comentario.countDocuments({ apunte_id: apunteId })
  ]);
  const promedio = agg[0] ? Math.round(agg[0].promedio * 10) / 10 : 0;
  const total = agg[0] ? agg[0].total : 0;
  await Apunte.updateOne(
    { _id: apunteId },
    { promedio, num_calificaciones: total, num_favoritos: favs, num_comentarios: coms }
  );
  return { promedio, num_calificaciones: total, num_favoritos: favs, num_comentarios: coms };
}

module.exports = { POPULATE, apunteDto, enriquecer, refrescarEstadisticas, archivoDto };
