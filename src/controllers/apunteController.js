import Apunte from '../models/Apunte.js';
import Archivo from '../models/Archivo.js';

// Crear un nuevo apunte
export const crearApunte = async (req, res) => {
  try {
    const { titulo, descripcion, materia_id, anio_academico, estado, archivos } = req.body;

    const nuevoApunte = new Apunte({
      titulo,
      descripcion,
      autor_id: req.usuario.id,
      materia_id,
      anio_academico: anio_academico || new Date().getFullYear(),
      estado: estado || 'borrador'
    });

    const apunteGuardado = await nuevoApunte.save();

    // Guardar archivos asociados si se proporcionaron
    if (archivos && archivos.length > 0) {
      const archivosDocs = archivos.map(a => ({
        apunte_id: apunteGuardado._id,
        url: a.url,
        tipo: a.tipo,
        nombre_original: a.nombre_original,
        tamano_bytes: a.tamano_bytes
      }));
      await Archivo.insertMany(archivosDocs);
    }

    res.status(201).json({ mensaje: 'Apunte creado exitosamente', apunte: apunteGuardado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el apunte', error: error.message });
  }
};

// Obtener apuntes publicados con filtros opcionales
export const obtenerApuntes = async (req, res) => {
  try {
    const { materia_id, busqueda } = req.query;
    let query = { estado: 'publicado' };

    if (materia_id) query.materia_id = materia_id;
    if (busqueda) {
      query.titulo = { $regex: busqueda, $options: 'i' };
    }

    const apuntes = await Apunte.find(query)
      .populate('autor_id', 'nombre apellido email_institucional')
      .populate('materia_id', 'nombre codigo')
      .sort({ createdAt: -1 });

    res.json(apuntes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener apuntes', error: error.message });
  }
};

// Obtener detalle de un apunte con sus archivos
export const obtenerApuntePorId = async (req, res) => {
  try {
    const apunte = await Apunte.findById(req.params.id)
      .populate('autor_id', 'nombre apellido email_institucional')
      .populate('materia_id', 'nombre codigo')
      .populate('ultimo_analisis_ia_id');

    if (!apunte) {
      return res.status(404).json({ mensaje: 'Apunte no encontrado' });
    }

    const archivos = await Archivo.find({ apunte_id: apunte._id });

    res.json({ apunte, archivos });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el apunte', error: error.message });
  }
};