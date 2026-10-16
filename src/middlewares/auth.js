import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];

  if (!tokenHeader) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó un token de autenticación.' });
  }

  // El token viene formateado como "Bearer <TOKEN>"
  const token = tokenHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Formato de token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, rol, email }
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
};