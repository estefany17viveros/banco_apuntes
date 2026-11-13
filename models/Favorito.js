const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const favoritoSchema = new mongoose.Schema(
  {
    apunte_id: { type: ObjectId, ref: 'Apunte', required: true },
    usuario_id: { type: ObjectId, ref: 'Usuario', required: true }
  },
  { timestamps: true, collection: 'favoritos' }
);

favoritoSchema.index({ apunte_id: 1, usuario_id: 1 }, { unique: true });

module.exports = mongoose.model('Favorito', favoritoSchema);
