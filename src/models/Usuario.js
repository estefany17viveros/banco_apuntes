
import { Schema, model } from 'mongoose';

const usuarioSchema = new Schema({
  id_institucional: { type: String, required: true, unique: true },
  email_institucional: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  rol: { type: String, enum: ['ESTUDIANTE', 'ADMINISTRADOR'], default: 'ESTUDIANTE' },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' }
}, { timestamps: true });

export default model('Usuario', usuarioSchema);