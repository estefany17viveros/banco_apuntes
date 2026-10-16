import { Schema, model } from 'mongoose';

const materiaSchema = new Schema({
  nombre: { type: String, required: true },
  codigo: { type: String, required: true },
  programa_id: { type: Schema.Types.ObjectId, ref: 'Programa', required: true }
}, { timestamps: true });

export default model('Materia', materiaSchema);