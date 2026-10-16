import express from 'express';
import Comentario from '../models/Comentario.js';

const router = express.Router();

// Crear comentario real en MongoDB
router.post('/comentarios', async (req, res) => {
  try {
    const nuevoComentario = new Comentario(req.body);
    const guardado = await nuevoComentario.save(); // <-- Inserción física en MongoDB
    res.status(201).json({ mensaje: "Comentario guardado con éxito", comentario: guardado });
  } catch (error) {
    console.error("Error al guardar comentario:", error);
    res.status(400).json({ error: "Error al guardar comentario", detalle: error.message });
  }
});

export default router;