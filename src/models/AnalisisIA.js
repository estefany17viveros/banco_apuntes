import { Schema, model } from 'mongoose';

const metodologiaSchema = new Schema({
  nombre: { 
    type: String, 
    enum: [
      'Resumen', 'Mapa conceptual', 'Flashcards', 'Práctica de ejercicios',
      'Preguntas y respuestas', 'Explicación conceptual', 'Ejemplificación', 'Comparación'
    ],
    required: true
  },
  porcentaje: { type: Number, min: 0, max: 100, required: true }
}, { _id: false });

const analisisIASchema = new Schema({
  apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte', required: true },
  version_modelo: { type: String, default: 'v1.0' },
  fecha_analisis: { type: Date, default: Date.now },
  metodologias: [metodologiaSchema],
  analisis_contenido: { type: String },
  analisis_moderacion: {
    es_seguro: { type: Boolean, default: true },
    motivo_bloqueo: { type: String }
  }
}, { timestamps: true });

export default model('AnalisisIA', analisisIASchema);