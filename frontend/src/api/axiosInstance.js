import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
// Los archivos subidos se sirven desde la raíz del servidor (sin /api)
export const FILES_URL = API_URL.replace(/\/api$/, '');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* sin localStorage */
  }
  return config;
});

// Mensaje legible para mostrar al usuario
export function mensajeError(err, porDefecto = 'Ocurrió un error inesperado.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err.response) {
    return `No hay conexión con el servidor (${API_URL}). Verifica que el backend esté encendido.`;
  }
  return err?.message || porDefecto;
}

export default api;
