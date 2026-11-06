import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Importaciones directas y estándar de rutas
import authRoutes from './routes/authRoutes.js';
import apunteRoutes from './routes/apunteRoutes.js';
import interaccionRoutes from './routes/interaccionRoutes.js';
import moderacionRoutes from './routes/moderacionRoutes.js';

dotenv.config();

// Inicializar conexión con MongoDB
try {
  await connectDB();
} catch (error) {
  console.error('⚠️ Error al conectar con MongoDB:', error.message);
}

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Endpoints de verificación para el Frontend
app.get('/api', (req, res) => {
  res.status(200).json({ status: 'ok', mensaje: 'Servidor conectado correctamente' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ estado: 'OK' });
});

// Registro de las sub-rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/apuntes', apunteRoutes);
app.use('/api/interacciones', interaccionRoutes);
app.use('/api/moderacion', moderacionRoutes);
// En src/index.js
app.use('/api/interacciones', interaccionRoutes);
app.use('/api/comentarios', interaccionRoutes);       // 👈 Permite llamadas directas a /api/comentarios
app.use('/api/calificaciones', interaccionRoutes);    // 👈 Permite llamadas directas a /api/calificaciones
app.use('/api/favoritos', interaccionRoutes);         // 👈 Permite llamadas directas a /api/favoritos

// Manejo de rutas 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores 500
app.use((err, req, res, next) => {
  console.error('🔥 Error interno del servidor:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor backend listo y escuchando en http://localhost:${PORT}`);
});