const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// OJO: se fija el nombre de la colección en 'calificaciones'.
// Sin esto Mongoose crea "calificacions" (por eso tenías una colección duplicada).
const calificacionSchema = new mongoose.Schema(
  {
    apunte_id: { type: ObjectId, ref: 'Apunte', required: true },
    usuario_id: { type: ObjectId, ref: 'Usuario', required: true },
    puntuacion: { type: Number, required: true, min: 1, max: 5 }
  },
  { timestamps: true, collection: 'calificaciones' }
);

calificacionSchema.index({ apunte_id: 1, usuario_id: 1 }, { unique: true });

module.exports = mongoose.model('Calificacion', calificacionSchema);
