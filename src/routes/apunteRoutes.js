import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import Apunte from '../models/Apunte.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    }
  })
});

const isId = (v) => mongoose.isValidObjectId(v);

// GET /api/apuntes
router.get('/', async (req, res) => {
  try {
    const { materia_id } = req.query;
    const filtro = isId(materia_id) ? { materia_id } : {};
    const apuntes = await Apunte.find(filtro).sort({ createdAt: -1 });
    res.json(apuntes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener apuntes', detalle: error.message });
  }
});

// POST /api/apuntes
router.post('/', upload.array('archivos'), async (req, res) => {
  try {
    const { titulo, title, contenido, descripcion, programa_id, materia_id, usuario_id, estado } = req.body;

    const tituloFinal = titulo?.trim() || title?.trim() || 'Apunte sin título';

    const nuevoApunte = new Apunte({
      titulo: tituloFinal,
      contenido: contenido || descripcion || '',
      programa_id: isId(programa_id) ? programa_id : null,
      materia_id: isId(materia_id) ? materia_id : null,
      usuario_id: isId(usuario_id) ? usuario_id : null,
      estado: estado || 'publicado'
    });

    const apunteGuardado = await nuevoApunte.save();
    res.status(201).json({ mensaje: 'Apunte guardado correctamente', apunte: apunteGuardado });
  } catch (error) {
    console.error('Error al guardar apunte:', error);
    res.status(400).json({ error: 'Error al guardar apunte en MongoDB', detalle: error.message });
  }
});

export default router;