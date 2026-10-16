import express from 'express';
import Apunte from '../models/Apunte.js';

const router = express.Router();

// Crear apunte REAL en MongoDB
router.post('/', async (req, res) => {
  try {
    const nuevoApunte = new Apunte(req.body);
    const apunteGuardado = await nuevoApunte.save(); // Guarda físicamente en MongoDB
    res.status(201).json({ mensaje: "Apunte guardado correctamente", apunte: apunteGuardado });
  } catch (error) {
    console.error("Error al guardar apunte:", error);
    res.status(400).json({ error: "Error al guardar apunte en MongoDB", detalle: error.message });
  }
});

// Obtener apuntes de MongoDB
router.get('/', async (req, res) => {
  try {
    const { materia_id } = req.query;
    const filtro = materia_id ? { materia_id } : {};
    const apuntes = await Apunte.find(filtro);
    res.status(200).json(apuntes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener apuntes", detalle: error.message });
  }
});

export default router;