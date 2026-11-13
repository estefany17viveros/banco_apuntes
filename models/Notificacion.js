const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const notificacionSchema = new mongoose.Schema(
  {
    usuario_id: { type: ObjectId, ref: 'Usuario', required: true, index: true },
    tipo: { type: String, enum: ['comentario', 'calificacion', 'favorito', 'moderacion'], required: true },
    mensaje: { type: String, required: true },
    apunte_id: { type: ObjectId, ref: 'Apunte', default: null },
    leida: { type: Boolean, default: false }
  },
  { timestamps: true, collection: 'notificaciones' }
);

module.exports = mongoose.model('Notificacion', notificacionSchema);
