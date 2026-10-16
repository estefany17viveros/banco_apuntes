import express from 'express';
import Reporte from '../models/Reporte.js';
import Apunte from '../models/Apunte.js';

const router = express.Router();

// HU18: Crear un reporte en MongoDB
router.post('/reportes', async (req, res) => {
  try {
    const nuevoReporte = new Reporte(req.body);
    const guardado = await nuevoReporte.save(); // Inserción física en la BD
    res.status(201).json({ mensaje: "Reporte creado exitosamente", reporte: guardado });
  } catch (error) {
    console.error("Error al crear reporte:", error);
    res.status(400).json({ error: "Error al guardar el reporte en MongoDB", detalle: error.message });
  }
});

// HU10: Moderar / Actualizar estado de apunte en MongoDB
router.patch('/apuntes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apunteActualizado = await Apunte.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!apunteActualizado) {
      return res.status(404).json({ error: "Apunte no encontrado" });
    }
    
    res.status(200).json({ mensaje: "Apunte moderado correctamente", apunte: apunteActualizado });
  } catch (error) {
    res.status(400).json({ error: "Error al moderar el apunte", detalle: error.message });
  }
});

export default router;