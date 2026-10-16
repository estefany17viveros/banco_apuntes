import Reporte from '../models/Reporte.js';
import AnalisisIA from '../models/AnalisisIA.js';
import Apunte from '../models/Apunte.js';

// Reportar un apunte
export const crearReporte = async (req, res) => {
  try {
    const { motivo, descripcion } = req.body;
    const nuevoReporte = new Reporte({
      apunte_id: req.params.id,
      reportado_por_id: req.usuario.id,
      motivo,
      descripcion
    });
    await nuevoReporte.save();
    res.status(201).json({ mensaje: 'Reporte registrado para revisión', reporte: nuevoReporte });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al enviar reporte', error: error.message });
  }
};

// Guardar resultado de análisis de Inteligencia Artificial
export const guardarAnalisisIA = async (req, res) => {
  try {
    const { metodologias, analisis_contenido, analisis_moderacion } = req.body;
    const apunte_id = req.params.id;

    const analisis = new AnalisisIA({
      apunte_id,
      metodologias,
      analisis_contenido,
      analisis_moderacion
    });

    const guardado = await analisis.save();

    // Actualizar referencia en el apunte
    await Apunte.findByIdAndUpdate(apunte_id, { ultimo_analisis_ia_id: guardado._id });

    res.status(201).json({ mensaje: 'Análisis de IA registrado', analisis: guardado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar análisis IA', error: error.message });
  }
};