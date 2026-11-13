const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

async function cargarUsuario(req) {
  const cab = req.headers.authorization || '';
  const token = cab.startsWith('Bearer ') ? cab.slice(7) : null;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const u = await Usuario.findById(id);
    return u && u.activo ? u : null;
  } catch {
    return null;
  }
}

// Exige sesión iniciada.
exports.auth = async (req, res, next) => {
  try {
    const u = await cargarUsuario(req);
    if (!u) return res.status(401).json({ message: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.' });
    req.user = u;
    next();
  } catch (e) {
    next(e);
  }
};

// Sesión opcional (para rutas públicas que muestran más datos si hay usuario).
exports.authOpcional = async (req, res, next) => {
  try {
    req.user = await cargarUsuario(req);
    next();
  } catch (e) {
    next(e);
  }
};

exports.soloRoles = (...roles) => (req, res, next) =>
  roles.includes(req.user?.rol) ? next() : res.status(403).json({ message: 'No tienes permisos para esta acción.' });
