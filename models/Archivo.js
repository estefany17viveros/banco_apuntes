const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// Guarda la información de cada archivo subido. El archivo físico queda en /uploads.
const archivoSchema = new mongoose.Schema(
  {
    apunte_id: { type: ObjectId, ref: 'Apunte', required: true, index: true },
    nombre_original: { type: String, required: true },
    nombre_archivo: { type: String, required: true },
    mimetype: { type: String, default: 'application/octet-stream' },
    tamano: { type: Number, default: 0 },
    url: { type: String, required: true },
    subido_por: { type: ObjectId, ref: 'Usuario' }
  },
  { timestamps: true, collection: 'archivos' }
);

module.exports = mongoose.model('Archivo', archivoSchema);
