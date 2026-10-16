import { Schema, model } from 'mongoose';

const calificacionSchema = new Schema({
  apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estrellas: { type: Number, min: 1, max: 5, required: true }
}, { timestamps: true });

// Garantiza 1 voto único por usuario por apunte
calificacionSchema.index({ apunte_id: 1, usuario_id: 1 }, { unique: true });

export default model('Calificacion', calificacionSchema);