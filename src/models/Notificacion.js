import { Schema, model } from 'mongoose';

const notificacionSchema = new Schema({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: { 
    type: String, 
    enum: [
      'apunte_publicado', 'apunte_rechazado', 'apunte_reportado', 
      'nuevo_comentario', 'nueva_calificacion', 'apunte_oculto', 
      'revision_completada'
    ],
    required: true 
  },
  mensaje: { type: String, required: true },
  leido: { type: Boolean, default: false },
  apunte_id: { type: Schema.Types.ObjectId, ref: 'Apunte' }
}, { timestamps: true });

export default model('Notificacion', notificacionSchema);