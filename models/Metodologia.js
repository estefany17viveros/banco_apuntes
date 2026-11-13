const mongoose = require('mongoose');

const metodologiaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, unique: true },
    descripcion: { type: String, default: '' }
  },
  { timestamps: true, collection: 'metodologias' }
);

module.exports = mongoose.model('Metodologia', metodologiaSchema);
