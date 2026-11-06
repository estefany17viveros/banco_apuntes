import Apunte from '../models/Apunte.js';
import Archivo from '../models/Archivo.js';
import mongoose from 'mongoose';

// Crear un nuevo apunte
export const crearApunte = async (req, res) => {
  try {
    const { titulo, contenido, descripcion, materia_id, estado, archivos, etiquetas, usuario_id } = req.body;

    // 1. Validar que al menos venga el título
    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({ mensaje: 'El título del apunte es obligatorio' });
    }

    // 2. Extraer ID del usuario de forma segura (soporta middleware de auth o envío directo desde React)
    let finalUsuarioId = null;
    const idCandidato = req.usuario?.id || req.usuario?._id || usuario_id;
    
    if (idCandidato && mongoose.Types.ObjectId.isValid(idCandidato)) {
      finalUsuarioId = idCandidato;
    }

    // 3. Validar ID de materia
    let finalMateriaId = null;
    if (materia_id && mongoose.Types.ObjectId.isValid(materia_id)) {
      finalMateriaId = materia_id;
    }

    // 4. Crear el documento
    const nuevoApunte = new Apunte({
      titulo,
      contenido: contenido || descripcion || '',
      usuario_id: finalUsuarioId,
      materia_id: finalMateriaId,
      etiquetas: Array.isArray(etiquetas) ? etiquetas : [],
      estado: estado || 'publicado'
    });

    const apunteGuardado = await nuevoApunte.save();

    // 5. Guardar archivos si existen
    if (archivos && Array.isArray(archivos) && archivos.length > 0) {
      const archivosDocs = archivos.map(a => ({
        apunte_id: apunteGuardado._id,
        url: a.url || '',
        tipo: a.tipo || 'pdf',
        nombre_original: a.nombre_original || a.nombre || 'Archivo adjunto',
        tamano_bytes: a.tamano_bytes || 0
      }));
      await Archivo.insertMany(archivosDocs);
    }

    return res.status(201).json({ 
      mensaje: 'Apunte creado exitosamente', 
      apunte: apunteGuardado 
    });

  } catch (error) {
    console.error('=== ERROR AL GUARDAR EN MONGODB ===', error);
    return res.status(500).json({ 
      mensaje: 'Error al guardar el apunte en MongoDB', 
      detalles: error.message 
    });
  }
};

// Obtener todos los apuntes
export const obtenerApuntes = async (req, res) => {
  try {
    const { materia_id, busqueda } = req.query;
    let query = {};

    if (materia_id && mongoose.Types.ObjectId.isValid(materia_id)) {
      query.materia_id = materia_id;
    }
    
    if (busqueda) {
      query.titulo = { $regex: busqueda, $options: 'i' };
    }

    const apuntes = await Apunte.find(query)
      .populate('usuario_id', 'nombre apellido email_institucional')
      .populate('materia_id', 'nombre codigo')
      .sort({ createdAt: -1 });

    res.json(apuntes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener apuntes', error: error.message });
  }
};

// Obtener apunte por ID
export const obtenerApuntePorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID no válido' });
    }

    const apunte = await Apunte.findById(req.params.id)
      .populate('usuario_id', 'nombre apellido email_institucional')
      .populate('materia_id', 'nombre codigo');

    if (!apunte) {
      return res.status(404).json({ mensaje: 'Apunte no encontrado' });
    }

    const archivos = await Archivo.find({ apunte_id: apunte._id });
    res.json({ apunte, archivos });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener apunte', error: error.message });
  }
};