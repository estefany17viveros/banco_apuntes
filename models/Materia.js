const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    programa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Programa', required: true },
    semestre: { type: Number, default: 1 },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'materias' }
);

materiaSchema.index({ programa_id: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Materia', materiaSchema);
