import { Schema, model } from 'mongoose';

const favoritoSchema = new Schema({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true }
}, { timestamps: true });

favoritoSchema.index({ usuario_id: 1, apunte_id: 1 }, { unique: true });

export default model('Favorito', favoritoSchema);