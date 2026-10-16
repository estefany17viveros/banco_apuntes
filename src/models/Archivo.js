import { Schema, model } from 'mongoose';

const archivoSchema = new Schema({
  apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
  url: { type: String, required: true },
  tipo: { type: String, enum: ['pdf', 'imagen', 'audio', 'video', 'documento'], required: true },
  nombre_original: { type: String, required: true },
  tamano_bytes: { type: Number }
}, { timestamps: true });

export default model('Archivo', archivoSchema);