import Comentario from '../models/Comentario.js';
import Calificacion from '../models/Calificacion.js';
import Favorito from '../models/Favorito.js';

// Agregar comentario
export const agregarComentario = async (req, res) => {
  try {
    const { contenido } = req.body;
    const nuevoComentario = new Comentario({
      apunte_id: req.params.id,
      autor_id: req.usuario.id,
      contenido
    });
    await nuevoComentario.save();
    res.status(201).json({ mensaje: 'Comentario agregado', comentario: nuevoComentario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar comentario', error: error.message });
  }
};

// Calificar apunte (1-5 estrellas)
export const calificarApunte = async (req, res) => {
  try {
    const { estrellas } = req.body;
    const apunte_id = req.params.id;
    const usuario_id = req.usuario.id;

    const calificacion = await Calificacion.findOneAndUpdate(
      { apunte_id, usuario_id },
      { estrellas },
      { new: true, upsert: true }
    );

    res.json({ mensaje: 'Calificación registrada', calificacion });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calificar', error: error.message });
  }
};

// Alternar Favorito (Guardar / Quitar)
export const toggleFavorito = async (req, res) => {
  try {
    const apunte_id = req.params.id;
    const usuario_id = req.usuario.id;

    const existe = await Favorito.findOne({ apunte_id, usuario_id });

    if (existe) {
      await Favorito.findByIdAndDelete(existe._id);
      return res.json({ mensaje: 'Apunte eliminado de favoritos', guardado: false });
    }

    await Favorito.create({ apunte_id, usuario_id });
    res.json({ mensaje: 'Apunte guardado en favoritos', guardado: true });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al gestionar favorito', error: error.message });
  }
};