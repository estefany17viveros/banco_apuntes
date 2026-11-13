const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const apunteSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 160 },
    contenido: { type: String, default: '' },
    autor_id: { type: ObjectId, ref: 'Usuario', required: true },
    programa_id: { type: ObjectId, ref: 'Programa', required: true },
    materia_id: { type: ObjectId, ref: 'Materia', required: true },
    metodologia_id: { type: ObjectId, ref: 'Metodologia', default: null },
    etiquetas: { type: [String], default: [] },
    estado: { type: String, enum: ['borrador', 'publicado', 'oculto'], default: 'publicado' },
    promedio: { type: Number, default: 0 },
    num_calificaciones: { type: Number, default: 0 },
    num_favoritos: { type: Number, default: 0 },
    num_comentarios: { type: Number, default: 0 },
    vistas: { type: Number, default: 0 }
  },
  { timestamps: true, collection: 'apuntes' }
);

apunteSchema.index({ estado: 1, createdAt: -1 });
apunteSchema.index({ autor_id: 1 });

module.exports = mongoose.model('Apunte', apunteSchema);
