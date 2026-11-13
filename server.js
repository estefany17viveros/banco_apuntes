require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'clave_de_desarrollo_cambiala_en_el_.env';
  console.warn('⚠️  Falta JWT_SECRET en el .env; usando una clave de desarrollo.');
}

const app = express();

app.use(cors({ origin: true, credentials: true })); // desarrollo: acepta el front en cualquier puerto
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/salud', (_req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/apunteRoutes'));
app.use('/api', require('./routes/interaccionRoutes'));
app.use('/api', require('./routes/moderacionRoutes'));

app.use('/api', (_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

// Manejador de errores: siempre responde JSON con { message }
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Error interno del servidor.';

  if (err.name === 'MulterError') {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Un archivo supera el tamaño máximo de 25 MB.'
      : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Máximo 10 archivos por apunte.'
      : `Error al subir el archivo: ${err.message}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'Ya existe un registro con esos datos.';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Algún identificador enviado no es válido.';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

conectarDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 API lista en http://localhost:${PORT}/api`)))
  .catch((err) => {
    console.error('❌ No se pudo conectar a MongoDB:', err.message);
    console.error('   Revisa que MongoDB esté encendido y que MONGO_URI del archivo .env sea correcto.');
    process.exit(1);
  });
