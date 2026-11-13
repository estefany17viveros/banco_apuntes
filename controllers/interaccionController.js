const Apunte = require('../models/Apunte');
const Calificacion = require('../models/Calificacion');
const Favorito = require('../models/Favorito');
const Comentario = require('../models/Comentario');
const Notificacion = require('../models/Notificacion');
const { POPULATE, enriquecer, refrescarEstadisticas } = require('../utils/apunteDto');
const { esId, httpError } = require('../utils/helpers');

async function apunteVisible(id, usuario) {
  if (!esId(id)) throw httpError(400, 'Identificador de apunte no válido.');
  const a = await Apunte.findById(id);
  if (!a) throw httpError(404, 'El apunte no existe.');
  const esDueno = String(a.autor_id) === String(usuario._id);
  if (a.estado !== 'publicado' && !esDueno && !['admin', 'moderador'].includes(usuario.rol)) {
    throw httpError(404, 'El apunte no está disponible.');
  }
  return a;
}

async function avisarAlAutor(apunte, usuario, tipo, mensaje) {
  if (String(apunte.autor_id) === String(usuario._id)) return;
  await Notificacion.create({ usuario_id: apunte.autor_id, tipo, mensaje, apunte_id: apunte._id });
}

/* ------------------------- Calificaciones ------------------------- */
exports.calificar = async (req, res, next) => {
  try {
    const a = await apunteVisible(req.params.id, req.user);
    const puntuacion = Number(req.body.puntuacion);
    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      throw httpError(400, 'La calificación debe ser un número entero de 1 a 5.');
    }
    const previa = await Calificacion.findOne({ apunte_id: a._id, usuario_id: req.user._id });
    await Calificacion.findOneAndUpdate(
      { apunte_id: a._id, usuario_id: req.user._id },
      { puntuacion },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const stats = await refrescarEstadisticas(a._id);
    if (!previa) {
      await avisarAlAutor(a, req.user, 'calificacion', `${req.user.nombre} calificó "${a.titulo}" con ${puntuacion} ★`);
    }
    res.json({ ...stats, mi_calificacion: puntuacion });
  } catch (e) { next(e); }
};

/* ------------------------- Favoritos ------------------------- */
exports.alternarFavorito = async (req, res, next) => {
  try {
    const a = await apunteVisible(req.params.id, req.user);
    const filtro = { apunte_id: a._id, usuario_id: req.user._id };
    const existe = await Favorito.findOne(filtro);
    let es_favorito;
    if (existe) {
      await existe.deleteOne();
      es_favorito = false;
    } else {
      await Favorito.create(filtro);
      es_favorito = true;
      await avisarAlAutor(a, req.user, 'favorito', `${req.user.nombre} guardó "${a.titulo}" en favoritos`);
    }
    const stats = await refrescarEstadisticas(a._id);
    res.json({ es_favorito, num_favoritos: stats.num_favoritos });
  } catch (e) { next(e); }
};

exports.misFavoritos = async (req, res, next) => {
  try {
    const favs = await Favorito.find({ usuario_id: req.user._id }).sort({ createdAt: -1 });
    const apuntes = await Apunte.find({ _id: { $in: favs.map((f) => f.apunte_id) }, estado: 'publicado' }).populate(POPULATE);
    const orden = new Map(favs.map((f, i) => [String(f.apunte_id), i]));
    apuntes.sort((x, y) => orden.get(String(x._id)) - orden.get(String(y._id)));
    res.json(await enriquecer(apuntes, req.user._id));
  } catch (e) { next(e); }
};

/* ------------------------- Comentarios ------------------------- */
const comentarioDto = (c) => ({
  _id: c._id,
  contenido: c.contenido,
  createdAt: c.createdAt,
  usuario: c.usuario_id && c.usuario_id._id ? { _id: c.usuario_id._id, nombre: c.usuario_id.nombre } : null
});

exports.listarComentarios = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de apunte no válido.');
    const items = await Comentario.find({ apunte_id: req.params.id }).sort({ createdAt: -1 }).populate('usuario_id', 'nombre');
    res.json(items.map(comentarioDto));
  } catch (e) { next(e); }
};

exports.comentar = async (req, res, next) => {
  try {
    const a = await apunteVisible(req.params.id, req.user);
    const contenido = (req.body.contenido || '').trim();
    if (!contenido) throw httpError(400, 'Escribe un comentario.');
    const c = await Comentario.create({ apunte_id: a._id, usuario_id: req.user._id, contenido });
    await refrescarEstadisticas(a._id);
    await avisarAlAutor(a, req.user, 'comentario', `${req.user.nombre} comentó en "${a.titulo}"`);
    await c.populate('usuario_id', 'nombre');
    res.status(201).json(comentarioDto(c));
  } catch (e) { next(e); }
};

exports.eliminarComentario = async (req, res, next) => {
  try {
    if (!esId(req.params.id)) throw httpError(400, 'Identificador de comentario no válido.');
    const c = await Comentario.findById(req.params.id);
    if (!c) throw httpError(404, 'El comentario no existe.');
    const esMio = String(c.usuario_id) === String(req.user._id);
    if (!esMio && !['admin', 'moderador'].includes(req.user.rol)) throw httpError(403, 'No puedes eliminar este comentario.');
    await c.deleteOne();
    await refrescarEstadisticas(c.apunte_id);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/* ------------------------- Notificaciones ------------------------- */
exports.notificaciones = async (req, res, next) => {
  try {
    const items = await Notificacion.find({ usuario_id: req.user._id }).sort({ createdAt: -1 }).limit(30);
    const no_leidas = await Notificacion.countDocuments({ usuario_id: req.user._id, leida: false });
    res.json({ items, no_leidas });
  } catch (e) { next(e); }
};

exports.leerTodas = async (req, res, next) => {
  try {
    await Notificacion.updateMany({ usuario_id: req.user._id, leida: false }, { leida: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
