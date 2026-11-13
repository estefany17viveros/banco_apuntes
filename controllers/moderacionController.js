const Apunte = require('../models/Apunte');
const Reporte = require('../models/Reporte');
const Usuario = require('../models/Usuario');
const Comentario = require('../models/Comentario');
const Programa = require('../models/Programa');
const Materia = require('../models/Materia');
const Notificacion = require('../models/Notificacion');
const { POPULATE, enriquecer } = require('../utils/apunteDto');
const { esId, escaparRegex, httpError } = require('../utils/helpers');

/* ------------------------- Reportar (cualquier usuario) ------------------------- */
exports.reportar = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de apunte no válido.');
    const a = await Apunte.findById(req.params.id);
    if (!a) throw httpError(404, 'El apunte no existe.');
    const motivo = (req.body.motivo || '').trim();
    if (!motivo) throw httpError(400, 'Selecciona el motivo del reporte.');

    const yaReportado = await Reporte.findOne({ apunte_id: a._id, reportado_por: req.user._id, estado: 'pendiente' });
    if (yaReportado) throw httpError(409, 'Ya reportaste este apunte; está pendiente de revisión.');

    await Reporte.create({ apunte_id: a._id, reportado_por: req.user._id, motivo, detalle: (req.body.detalle || '').trim() });
    res.status(201).json({ ok: true, message: 'Reporte enviado. Un moderador lo revisará.' });
  } catch (e) { next(e); }
};

/* ------------------------- Reportes (moderación) ------------------------- */
exports.listarReportes = async (req, res, next) => {
  try {
    const estado = ['pendiente', 'resuelto', 'descartado'].includes(req.query.estado) ? req.query.estado : 'pendiente';
    const items = await Reporte.find({ estado })
      .sort({ createdAt: -1 })
      .populate('reportado_por', 'nombre email')
      .populate({ path: 'apunte_id', select: 'titulo estado autor_id', populate: { path: 'autor_id', select: 'nombre' } });
    res.json(
      items.map((r) => ({
        _id: r._id,
        motivo: r.motivo,
        detalle: r.detalle,
        estado: r.estado,
        resolucion: r.resolucion,
        createdAt: r.createdAt,
        reportado_por: r.reportado_por ? { nombre: r.reportado_por.nombre, email: r.reportado_por.email } : null,
        apunte: r.apunte_id
          ? { _id: r.apunte_id._id, titulo: r.apunte_id.titulo, estado: r.apunte_id.estado, autor: r.apunte_id.autor_id?.nombre }
          : null
      }))
    );
  } catch (e) { next(e); }
};

exports.resolverReporte = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de reporte no válido.');
    const r = await Reporte.findById(req.params.id);
    if (!r) throw httpError(404, 'El reporte no existe.');
    const { accion } = req.body; // 'ocultar' | 'descartar'
    if (!['ocultar', 'descartar'].includes(accion)) throw httpError(400, 'Acción no válida.');

    if (accion === 'ocultar') {
      const a = await Apunte.findByIdAndUpdate(r.apunte_id, { estado: 'oculto' });
      if (a) {
        await Notificacion.create({
          usuario_id: a.autor_id,
          tipo: 'moderacion',
          mensaje: `Tu apunte "${a.titulo}" fue ocultado por moderación (${r.motivo}).`,
          apunte_id: a._id
        });
      }
      r.estado = 'resuelto';
      r.resolucion = 'Apunte ocultado';
    } else {
      r.estado = 'descartado';
      r.resolucion = 'Reporte descartado';
    }
    r.resuelto_por = req.user._id;
    await r.save();
    res.json({ ok: true, estado: r.estado });
  } catch (e) { next(e); }
};

/* ------------------------- Apuntes (moderación) ------------------------- */
exports.listarApuntesAdmin = async (req, res, next) => {
  try {
    const f = {};
    if (['borrador', 'publicado', 'oculto'].includes(req.query.estado)) f.estado = req.query.estado;
    if (req.query.q) {
      const rx = new RegExp(escaparRegex(req.query.q.trim()), 'i');
      f.titulo = rx;
    }
    const docs = await Apunte.find(f).sort({ createdAt: -1 }).limit(100).populate(POPULATE);
    res.json(await enriquecer(docs, req.user._id));
  } catch (e) { next(e); }
};

exports.cambiarEstadoApunte = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de apunte no válido.');
    const { estado } = req.body;
    if (!['borrador', 'publicado', 'oculto'].includes(estado)) throw httpError(400, 'Estado no válido.');
    const a = await Apunte.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!a) throw httpError(404, 'El apunte no existe.');
    res.json({ ok: true, estado: a.estado });
  } catch (e) { next(e); }
};

/* ------------------------- Usuarios (admin) ------------------------- */
exports.listarUsuarios = async (_req, res, next) => {
  try {
    const usuarios = await Usuario.find().sort({ createdAt: -1 }).populate('programa_id', 'nombre');
    const conteos = await Apunte.aggregate([{ $group: { _id: '$autor_id', total: { $sum: 1 } } }]);
    const mapa = new Map(conteos.map((c) => [String(c._id), c.total]));
    res.json(
      usuarios.map((u) => ({
        _id: u._id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        activo: u.activo,
        programa: u.programa_id?.nombre || null,
        apuntes: mapa.get(String(u._id)) || 0,
        createdAt: u.createdAt
      }))
    );
  } catch (e) { next(e); }
};

exports.actualizarUsuario = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de usuario no válido.');
    if (String(req.params.id) === String(req.user._id)) throw httpError(400, 'No puedes modificar tu propia cuenta desde aquí.');
    const cambios = {};
    if (['estudiante', 'moderador', 'admin'].includes(req.body.rol)) cambios.rol = req.body.rol;
    if (typeof req.body.activo === 'boolean') cambios.activo = req.body.activo;
    const u = await Usuario.findByIdAndUpdate(req.params.id, cambios, { new: true });
    if (!u) throw httpError(404, 'El usuario no existe.');
    res.json({ ok: true, rol: u.rol, activo: u.activo });
  } catch (e) { next(e); }
};

/* ------------------------- Catálogo (admin) ------------------------- */
exports.crearPrograma = async (req, res, next) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    if (!nombre) throw httpError(400, 'El nombre del programa es obligatorio.');
    const p = await Programa.create({ nombre, codigo: (req.body.codigo || '').trim() });
    res.status(201).json(p);
  } catch (e) { next(e); }
};

exports.crearMateria = async (req, res, next) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    if (!nombre) throw httpError(400, 'El nombre de la materia es obligatorio.');
    if (!esId(req.body.programa_id)) throw httpError(400, 'Selecciona un programa.');
    const m = await Materia.create({ nombre, programa_id: req.body.programa_id, semestre: Number(req.body.semestre) || 1 });
    res.status(201).json(m);
  } catch (e) { next(e); }
};

/* ------------------------- Estadísticas ------------------------- */
exports.estadisticas = async (_req, res, next) => {
  try {
    const [usuarios, apuntes, publicados, ocultos, reportesPend, comentarios, top, porPrograma] = await Promise.all([
      Usuario.countDocuments(),
      Apunte.countDocuments(),
      Apunte.countDocuments({ estado: 'publicado' }),
      Apunte.countDocuments({ estado: 'oculto' }),
      Reporte.countDocuments({ estado: 'pendiente' }),
      Comentario.countDocuments(),
      Apunte.find({ estado: 'publicado' }).sort({ promedio: -1, num_calificaciones: -1 }).limit(5).populate(POPULATE),
      Apunte.aggregate([
        { $group: { _id: '$programa_id', total: { $sum: 1 } } },
        { $lookup: { from: 'programas', localField: '_id', foreignField: '_id', as: 'p' } },
        { $project: { total: 1, nombre: { $ifNull: [{ $arrayElemAt: ['$p.nombre', 0] }, 'Sin programa'] } } },
        { $sort: { total: -1 } }
      ])
    ]);
    res.json({
      usuarios, apuntes, publicados, ocultos, reportes_pendientes: reportesPend, comentarios,
      top: top.map((a) => ({ _id: a._id, titulo: a.titulo, promedio: a.promedio, num_calificaciones: a.num_calificaciones, autor: a.autor_id?.nombre })),
      por_programa: porPrograma.map((p) => ({ nombre: p.nombre, total: p.total }))
    });
  } catch (e) { next(e); }
};
