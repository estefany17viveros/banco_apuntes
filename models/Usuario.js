const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    email: { type: String, required: [true, 'El correo es obligatorio'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    rol: { type: String, enum: ['estudiante', 'moderador', 'admin'], default: 'estudiante' },
    programa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Programa', default: null },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'usuarios' }
);

usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

usuarioSchema.methods.compararPassword = function (plano) {
  return bcrypt.compare(plano, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
