import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Importar rutas de la API
import authRoutes from './routes/authRoutes.js';
import apunteRoutes from './routes/apunteRoutes.js';
import interaccionRoutes from './routes/interaccionRoutes.js';
import moderacionRoutes from './routes/moderacionRoutes.js';

dotenv.config();

// Conectar a MongoDB
connectDB();

const app = express();

// Middlewares principales
app.use(cors());
app.use(express.json());

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/apuntes', apunteRoutes);
app.use('/api/interacciones', interaccionRoutes);
app.use('/api/moderacion', moderacionRoutes);

// Ruta de comprobación de estado de la API
app.get('/api/health', (req, res) => {
  res.json({ estado: 'OK', mensaje: 'Servidor funcionando correctamente' });
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores inesperados (500)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});