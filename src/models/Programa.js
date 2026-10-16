import { Schema, model } from 'mongoose';

const programaSchema = new Schema({
  nombre: { type: String, required: true, unique: true },
  codigo: { type: String, required: true, unique: true },
  descripcion: { type: String }
}, { timestamps: true });

export default model('Programa', programaSchema);