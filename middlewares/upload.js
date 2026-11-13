const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { httpError } = require('../utils/helpers');

const carpeta = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(carpeta, { recursive: true });

const MAX_MB = 25;
const MAX_ARCHIVOS = 10;

const EXT_PERMITIDAS = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md', '.zip',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.mp3', '.wav', '.ogg', '.m4a',
  '.mp4', '.webm', '.mov'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, carpeta),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: MAX_ARCHIVOS },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXT_PERMITIDAS.has(ext)) {
      return cb(httpError(400, `Tipo de archivo no permitido: ${ext || 'sin extensión'}`));
    }
    cb(null, true);
  }
});

module.exports = { upload, MAX_MB, MAX_ARCHIVOS };
