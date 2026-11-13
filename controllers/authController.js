const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { httpError, esId } = require('../utils/helpers');

const firmar = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const usuarioDto = (u) => ({
  _id: u._id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
  programa_id: u.programa_id || null,
  createdAt: u.createdAt
});

exports.registrar = async (req, res, next) => {
  try {
    const { nombre, email, password, programa_id } = req.body;
    if (!nombre?.trim()) throw httpError(400, 'El nombre es obligatorio.');
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Escribe un correo válido.');
    if (!password || password.length < 6) throw httpError(400, 'La contraseña debe tener mínimo 6 caracteres.');

    const existe = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (existe) throw httpError(409, 'Ya existe una cuenta con ese correo.');

    const u = await Usuario.create({
      nombre,
      email,
      password,
      programa_id: esId(programa_id) ? programa_id : null
    });
    res.status(201).json({ token: firmar(u), usuario: usuarioDto(u) });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw httpError(400, 'Escribe tu correo y contraseña.');
    const u = await Usuario.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!u || !u.password || !(await u.compararPassword(password))) {
      throw httpError(401, 'Correo o contraseña incorrectos.');
    }
    if (!u.activo) throw httpError(403, 'Tu cuenta está desactivada. Contacta al administrador.');
    res.json({ token: firmar(u), usuario: usuarioDto(u) });
  } catch (e) {
    next(e);
  }
};

exports.me = (req, res) => res.json({ usuario: usuarioDto(req.user) });

exports.actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, programa_id, password_actual, password_nueva } = req.body;
    const u = await Usuario.findById(req.user._id).select('+password');
    if (nombre !== undefined) {
      if (!nombre.trim()) throw httpError(400, 'El nombre no puede estar vacío.');
      u.nombre = nombre.trim();
    }
    if (programa_id !== undefined) u.programa_id = esId(programa_id) ? programa_id : null;
    if (password_nueva) {
      if (password_nueva.length < 6) throw httpError(400, 'La nueva contraseña debe tener mínimo 6 caracteres.');
      if (!password_actual || !(await u.compararPassword(password_actual))) {
        throw httpError(400, 'La contraseña actual no es correcta.');
      }
      u.password = password_nueva;
    }
    await u.save();
    res.json({ usuario: usuarioDto(u) });
  } catch (e) {
    next(e);
  }
};
