

import jwt from 'jsonwebtoken';

import Usuario from '../models/Usuario.js';

export const loginSSO = async (req, res) => {
  try {
    const { id_institucional, email_institucional, nombre, apellido } = req.body;

    if (!email_institucional || !id_institucional) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios de la universidad.' });
    }

    // Registrar o actualizar usuario (Upsert)
    let usuario = await Usuario.findOneAndUpdate(
      { email_institucional },
      { id_institucional, email_institucional, nombre, apellido },
      { new: true, upsert: true }
    );

    // Generar JWT
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol, email: usuario.email_institucional },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Autenticación exitosa',
      token,
      usuario: {
        id: usuario._id,
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        email: usuario.email_institucional,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor al autenticar', error: error.message });
  }
};