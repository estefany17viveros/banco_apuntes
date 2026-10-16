import { Schema, model } from 'mongoose';

const apunteSchema = new Schema({
  titulo: { type: String, required: true },
  contenido: { type: String },
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  materia_id: { type: Schema.Types.ObjectId, ref: 'Materia' },
  metodologia_id: { type: Schema.Types.ObjectId, ref: 'AnalisisIA' },
  etiquetas: [{ type: String }],
  estado: { type: String, default: 'publicado' }
}, { timestamps: true });

export default model('Apunte', apunteSchema);