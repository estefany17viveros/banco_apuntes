const mongoose = require('mongoose');

const programaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, unique: true },
    codigo: { type: String, trim: true, default: '' },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'programas' }
);

module.exports = mongoose.model('Programa', programaSchema);
