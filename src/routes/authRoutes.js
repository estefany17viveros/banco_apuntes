import express from 'express';
const router = express.Router();

router.post('/registro', (req, res) => {
  res.status(201).json({ mensaje: "Usuario registrado con éxito", usuario: req.body });
});

router.post('/login', (req, res) => {
  res.status(200).json({ mensaje: "Autenticación exitosa", token: "jwt_token_de_prueba" });
});

export default router;