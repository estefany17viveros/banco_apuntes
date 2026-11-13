const path = require('path');
const Apunte = require('../models/Apunte');
const Archivo = require('../models/Archivo');
const Calificacion = require('../models/Calificacion');
const Favorito = require('../models/Favorito');
const Comentario = require('../models/Comentario');
const Reporte = require('../models/Reporte');
const Programa = require('../models/Programa');
const Materia = require('../models/Materia');
const Metodologia = require('../models/Metodologia');
const { POPULATE, enriquecer } = require('../utils/apunteDto');
const { esId, escaparRegex, httpError, parseLista, borrarArchivoFisico, arreglarNombre } = require('../utils/helpers');

const UPLOADS = path.join(__dirname, '..', 'uploads');
const esAdmin = (u) => u && ['admin', 'moderador'].includes(u.rol);
const esDueno = (a, u) => u && String(a.autor_id?._id || a.autor_id) === String(u._id);

/* ------------------------- Catálogo ------------------------- */
exports.programas = async (_req, res, next) => {
  try {
    res.json(await Programa.find({ activo: true }).sort({ nombre: 1 }));
  } catch (e) { next(e); }
};

exports.materias = async (req, res, next) => {
  try {
    const f = { activo: true };
    if (esId(req.query.programa_id)) f.programa_id = req.query.programa_id;
    res.json(await Materia.find(f).sort({ semestre: 1, nombre: 1 }));
  } catch (e) { next(e); }
};

exports.metodologias = async (_req, res, next) => {
  try {
    res.json(await Metodologia.find().sort({ nombre: 1 }));
  } catch (e) { next(e); }
};

/* ------------------------- Listados ------------------------- */
exports.listar = async (req, res, next) => {
  try {
    const { q, programa, materia, metodologia, orden = 'recientes' } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);

    const filtro = { estado: 'publicado' };
    if (esId(programa)) filtro.programa_id = programa;
    if (esId(materia)) filtro.materia_id = materia;
    if (esId(metodologia)) filtro.metodologia_id = metodologia;
    if (q && q.trim()) {
      const rx = new RegExp(escaparRegex(q.trim()), 'i');
      filtro.$or = [{ titulo: rx }, { contenido: rx }, { etiquetas: rx }];
    }

    const sort =
      orden === 'mejor' ? { promedio: -1, num_calificaciones: -1, createdAt: -1 }
      : orden === 'populares' ? { num_favoritos: -1, vistas: -1, createdAt: -1 }
      : { createdAt: -1 };

    const [total, docs] = await Promise.all([
      Apunte.countDocuments(filtro),
      Apunte.find(filtro).sort(sort).skip((page - 1) * limit).limit(limit).populate(POPULATE)
    ]);

    res.json({
      data: await enriquecer(docs, req.user?._id),
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1)
    });
  } catch (e) { next(e); }
};

exports.mios = async (req, res, next) => {
  try {
    const docs = await Apunte.find({ autor_id: req.user._id }).sort({ createdAt: -1 }).populate(POPULATE);
    res.json(await enriquecer(docs, req.user._id));
  } catch (e) { next(e); }
};

exports.obtener = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de apunte no válido.');
    const a = await Apunte.findById(req.params.id).populate(POPULATE);
    if (!a) throw httpError(404, 'El apunte no existe.');
    if (a.estado !== 'publicado' && !esDueno(a, req.user) && !esAdmin(req.user)) {
      throw httpError(404, 'El apunte no está disponible.');
    }
    if (a.estado === 'publicado' && !esDueno(a, req.user)) {
      await Apunte.updateOne({ _id: a._id }, { $inc: { vistas: 1 } });
      a.vistas += 1;
    }
    const [dto] = await enriquecer([a], req.user?._id);
    res.json(dto);
  } catch (e) { next(e); }
};

/* ------------------------- Crear / editar / borrar ------------------------- */
async function validarCampos({ programa_id, materia_id, metodologia_id }) {
  if (!esId(programa_id)) throw httpError(400, 'Selecciona un programa.');
  if (!esId(materia_id)) throw httpError(400, 'Selecciona una materia.');
  const materia = await Materia.findById(materia_id);
  if (!materia) throw httpError(400, 'La materia seleccionada no existe.');
  if (String(materia.programa_id) !== String(programa_id)) {
    throw httpError(400, 'La materia no pertenece al programa seleccionado.');
  }
  if (metodologia_id && !esId(metodologia_id)) throw httpError(400, 'Metodología no válida.');
}

const guardarArchivos = (apunteId, usuarioId, files) =>
  Archivo.insertMany(
    files.map((f) => ({
      apunte_id: apunteId,
      nombre_original: arreglarNombre(f.originalname),
      nombre_archivo: f.filename,
      mimetype: f.mimetype,
      tamano: f.size,
      url: `/uploads/${f.filename}`,
      subido_por: usuarioId
    }))
  );

exports.crear = async (req, res, next) => {
  const subidos = req.files || [];
  try {
    const { titulo, contenido = '', programa_id, materia_id, metodologia_id, estado } = req.body;
    if (!titulo?.trim()) throw httpError(400, 'El título es obligatorio.');
    if (!contenido.trim() && subidos.length === 0) {
      throw httpError(400, 'Escribe el contenido del apunte o adjunta al menos un archivo.');
    }
    await validarCampos({ programa_id, materia_id, metodologia_id });

    const apunte = await Apunte.create({
      titulo,
      contenido,
      autor_id: req.user._id,
      programa_id,
      materia_id,
      metodologia_id: metodologia_id || null,
      etiquetas: parseLista(req.body.etiquetas),
      estado: estado === 'borrador' ? 'borrador' : 'publicado'
    });
    if (subidos.length) await guardarArchivos(apunte._id, req.user._id, subidos);

    const completo = await Apunte.findById(apunte._id).populate(POPULATE);
    const [dto] = await enriquecer([completo], req.user._id);
    res.status(201).json(dto);
  } catch (e) {
    subidos.forEach((f) => borrarArchivoFisico(f.path));
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  const subidos = req.files || [];
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de apunte no válido.');
    const a = await Apunte.findById(req.params.id);
    if (!a) throw httpError(404, 'El apunte no existe.');
    if (!esDueno(a, req.user) && !esAdmin(req.user)) throw httpError(403, 'No puedes editar este apunte.');

    const b = req.body;
    const programa_id = b.programa_id || a.programa_id;
    const materia_id = b.materia_id || a.materia_id;
    await validarCampos({ programa_id: String(programa_id), materia_id: String(materia_id), metodologia_id: b.metodologia_id });

    if (b.titulo !== undefined) {
      if (!b.titulo.trim()) throw httpError(400, 'El título es obligatorio.');
      a.titulo = b.titulo;
    }
    if (b.contenido !== undefined) a.contenido = b.contenido;
    a.programa_id = programa_id;
    a.materia_id = materia_id;
    if (b.metodologia_id !== undefined) a.metodologia_id = b.metodologia_id || null;
    if (b.etiquetas !== undefined) a.etiquetas = parseLista(b.etiquetas);
    // El dueño puede alternar borrador/publicado; un apunte "oculto" por moderación solo lo cambia un admin.
    if (['borrador', 'publicado'].includes(b.estado) && (a.estado !== 'oculto' || esAdmin(req.user))) {
      a.estado = b.estado;
    }

    // Quitar archivos marcados
    const quitar = parseLista(b.eliminar_archivos).filter(esId);
    if (quitar.length) {
      const docs = await Archivo.find({ _id: { $in: quitar }, apunte_id: a._id });
      docs.forEach((d) => borrarArchivoFisico(path.join(UPLOADS, d.nombre_archivo)));
      await Archivo.deleteMany({ _id: { $in: docs.map((d) => d._id) } });
    }
    if (subidos.length) await guardarArchivos(a._id, req.user._id, subidos);

    const restantes = await Archivo.countDocuments({ apunte_id: a._id });
    if (!a.contenido.trim() && restantes === 0) {
      throw httpError(400, 'El apunte debe tener contenido o al menos un archivo.');
    }
    await a.save();

    const completo = await Apunte.findById(a._id).populate(POPULATE);
    const [dto] = await enriquecer([completo], req.user._id);
    res.json(dto);
  } catch (e) {
    subidos.forEach((f) => borrarArchivoFisico(f.path));
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de apunte no válido.');
    const a = await Apunte.findById(req.params.id);
    if (!a) throw httpError(404, 'El apunte no existe.');
    if (!esDueno(a, req.user) && !esAdmin(req.user)) throw httpError(403, 'No puedes eliminar este apunte.');

    const archivos = await Archivo.find({ apunte_id: a._id });
    archivos.forEach((f) => borrarArchivoFisico(path.join(UPLOADS, f.nombre_archivo)));
    await Promise.all([
      Archivo.deleteMany({ apunte_id: a._id }),
      Calificacion.deleteMany({ apunte_id: a._id }),
      Favorito.deleteMany({ apunte_id: a._id }),
      Comentario.deleteMany({ apunte_id: a._id }),
      Reporte.deleteMany({ apunte_id: a._id })
    ]);
    await a.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
};
