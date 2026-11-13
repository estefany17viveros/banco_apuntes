const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const reporteSchema = new mongoose.Schema(
  {
    apunte_id: { type: ObjectId, ref: 'Apunte', required: true },
    reportado_por: { type: ObjectId, ref: 'Usuario', required: true },
    motivo: { type: String, required: true, trim: true },
    detalle: { type: String, default: '', trim: true },
    estado: { type: String, enum: ['pendiente', 'resuelto', 'descartado'], default: 'pendiente' },
    resuelto_por: { type: ObjectId, ref: 'Usuario', default: null },
    resolucion: { type: String, default: '' }
  },
  { timestamps: true, collection: 'reportes' }
);

module.exports = mongoose.model('Reporte', reporteSchema);
