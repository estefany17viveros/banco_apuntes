const fs = require('fs');
const mongoose = require('mongoose');

const esId = (v) => typeof v === 'string' && mongoose.isValidObjectId(v) && /^[0-9a-fA-F]{24}$/.test(v);

const escaparRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Crea un error con código HTTP para que el manejador de errores lo responda bien.
const httpError = (status, message) => Object.assign(new Error(message), { status });

// Acepta '["a","b"]' (JSON) o 'a, b' (texto separado por comas) o un arreglo.
const parseLista = (valor) => {
  if (!valor) return [];
  let lista = valor;
  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor);
      lista = Array.isArray(parsed) ? parsed : valor.split(',');
    } catch {
      lista = valor.split(',');
    }
  }
  return [...new Set(lista.map((x) => String(x).trim()).filter(Boolean))].slice(0, 10);
};

const borrarArchivoFisico = (ruta) => {
  if (!ruta) return;
  fs.unlink(ruta, () => {});
};

// Multer entrega el nombre original en latin1; lo convertimos a utf8 (tildes, ñ).
const arreglarNombre = (nombre = '') => Buffer.from(nombre, 'latin1').toString('utf8');

module.exports = { esId, escaparRegex, httpError, parseLista, borrarArchivoFisico, arreglarNombre };
