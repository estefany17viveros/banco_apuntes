import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();
const { Schema } = mongoose;

const isId = (v) => mongoose.isValidObjectId(v);

/* ---------- MODELOS SAFE ---------- */
const Comentario =
  mongoose.models.Comentario ||
  mongoose.model(
    'Comentario',
    new Schema(
      {
        apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
        usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
        usuario_nombre: { type: String, default: 'Estudiante Anónimo' },
        contenido: { type: String, required: true, trim: true }
      },
      { timestamps: true }
    )
  );

const Calificacion =
  mongoose.models.Calificacion ||
  mongoose.model(
    'Calificacion',
    new Schema(
      {
        apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
        usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
        estrellas: { type: Number, min: 1, max: 5, required: true }
      },
      { timestamps: true }
    )
  );

const Favorito =
  mongoose.models.Favorito ||
  mongoose.model(
    'Favorito',
    new Schema(
      {
        apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
        usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null }
      },
      { timestamps: true }
    )
  );

/* ---------- CONTROLADORES FLEXIBLES ---------- */

// --- FAVORITOS ---
const alternarFavorito = async (req, res) => {
  try {
    const { apunte_id, usuario_id } = req.body;
    if (!isId(apunte_id)) return res.status(400).json({ error: 'ID de apunte no válido' });

    const idUsuario = isId(usuario_id) ? usuario_id : null;
    const filtro = idUsuario ? { apunte_id, usuario_id: idUsuario } : { apunte_id };

    const existente = await Favorito.findOneAndDelete(filtro);
    if (existente) return res.json({ favorito: false, mensaje: 'Eliminado de favoritos' });

    const nuevoFav = await Favorito.create({ apunte_id, usuario_id: idUsuario });
    res.status(201).json({ favorito: true, mensaje: 'Agregado a favoritos', data: nuevoFav });
  } catch (error) {
    console.error('Error en favoritos:', error);
    res.status(500).json({ error: 'Error al procesar favorito', detalle: error.message });
  }
};

const obtenerFavoritos = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const filtro = isId(usuario_id) ? { usuario_id } : {};
    const lista = await Favorito.find(filtro);
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener favoritos', detalle: error.message });
  }
};

// --- COMENTARIOS ---
const guardarComentario = async (req, res) => {
  try {
    const { apunte_id, usuario_id, usuario_nombre, contenido, texto } = req.body;
    const contenidoFinal = contenido || texto;

    if (!isId(apunte_id)) return res.status(400).json({ error: 'ID de apunte no válido' });
    if (!contenidoFinal?.trim()) return res.status(400).json({ error: 'El comentario no puede estar vacío' });

    const nuevoComentario = await Comentario.create({
      apunte_id,
      usuario_id: isId(usuario_id) ? usuario_id : null,
      usuario_nombre: usuario_nombre || 'Estudiante Anónimo',
      contenido: contenidoFinal.trim()
    });

    res.status(201).json({ mensaje: 'Comentario guardado correctamente', comentario: nuevoComentario });
  } catch (error) {
    console.error('Error en comentario:', error);
    res.status(500).json({ error: 'Error al guardar comentario', detalle: error.message });
  }
};

const obtenerComentarios = async (req, res) => {
  try {
    const { apunte_id } = req.query;
    const filtro = isId(apunte_id) ? { apunte_id } : {};
    const lista = await Comentario.find(filtro).sort({ createdAt: 1 });
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comentarios', detalle: error.message });
  }
};

// --- CALIFICACIONES ---
const guardarCalificacion = async (req, res) => {
  try {
    const { apunte_id, usuario_id, estrellas } = req.body;
    if (!isId(apunte_id)) return res.status(400).json({ error: 'ID de apunte no válido' });

    const numEstrellas = Number(estrellas);
    if (!Number.isInteger(numEstrellas) || numEstrellas < 1 || numEstrellas > 5) {
      return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5 estrellas' });
    }

    const idUsuario = isId(usuario_id) ? usuario_id : new mongoose.Types.ObjectId();
    const cal = await Calificacion.findOneAndUpdate(
      { apunte_id, usuario_id: idUsuario },
      { estrellas: numEstrellas },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ mensaje: 'Calificación guardada correctamente', calificacion: cal });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar calificación', detalle: error.message });
  }
};

/* ---------- MAPEADOR DE RUTAS MULTI-ALIAS ---------- */

// Rutas cuando Express entra por /api/favoritos, /api/comentarios o /api/calificaciones
router.post('/', (req, res, next) => {
  const url = req.baseUrl;
  if (url.includes('favoritos')) return alternarFavorito(req, res, next);
  if (url.includes('comentarios')) return guardarComentario(req, res, next);
  if (url.includes('calificaciones')) return guardarCalificacion(req, res, next);
  res.status(404).json({ error: 'Acción no encontrada en raíz' });
});

router.get('/', (req, res, next) => {
  const url = req.baseUrl;
  if (url.includes('favoritos')) return obtenerFavoritos(req, res, next);
  if (url.includes('comentarios')) return obtenerComentarios(req, res, next);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Rutas explícitas cuando Express entra por /api/interacciones/...
router.post('/favoritos', alternarFavorito);
router.get('/favoritos', obtenerFavoritos);

router.post('/comentarios', guardarComentario);
router.get('/comentarios', obtenerComentarios);

router.post('/calificaciones', guardarCalificacion);

export default router;