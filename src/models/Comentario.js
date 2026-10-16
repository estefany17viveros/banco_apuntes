import { Schema, model } from 'mongoose';

const comentarioSchema = new Schema({
  apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  contenido: { type: String, required: true }
}, { timestamps: true });

export default model('Comentario', comentarioSchema);