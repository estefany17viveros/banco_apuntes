import { Schema, model } from 'mongoose';

const reporteSchema = new Schema({
  apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
  reportado_por_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  motivo: {
    type: String,
    enum: [
      'contenido_inapropiado',
      'informacion_incorrecta',
      'spam',
      'contenido_ofensivo',
      'posible_plagio',
      'contenido_no_academico',
      'derechos_de_autor',
      'otro'
    ],
    required: true
  },
  descripcion: { type: String },
  estado: { type: String, enum: ['pendiente', 'revisado', 'desestimado'], default: 'pendiente' }
}, { timestamps: true });

export default model('Reporte', reporteSchema);