const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const comentarioSchema = new mongoose.Schema(
  {
    apunte_id: { type: ObjectId, ref: 'Apunte', required: true, index: true },
    usuario_id: { type: ObjectId, ref: 'Usuario', required: true },
    contenido: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true, collection: 'comentarios' }
);

module.exports = mongoose.model('Comentario', comentarioSchema);
