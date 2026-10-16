export const esAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'Usuario no autenticado.' });
  }

  if (req.usuario.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  next();
};