import { FILES_URL } from './api/axiosInstance';

export const urlArchivo = (url) => (/^https?:/.test(url) ? url : `${FILES_URL}${url}`);

export const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const fmtFechaHora = (f) =>
  f ? new Date(f).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export const fmtTam = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const tipoArchivo = (mime = '', nombre = '') => {
  const ext = nombre.split('.').pop().toLowerCase();
  if (mime.startsWith('image/')) return 'imagen';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  return 'archivo';
};

export const ICONO_TIPO = { imagen: '🖼️', pdf: '📕', audio: '🎧', video: '🎬', word: '📘', ppt: '📙', excel: '📗', archivo: '📎' };

export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

export const resumen = (texto = '', max = 150) => {
  const t = texto.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max).trim()}…` : t;
};
