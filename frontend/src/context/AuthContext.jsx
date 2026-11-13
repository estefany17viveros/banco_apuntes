import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axiosInstance';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);

  const verificarSesion = useCallback(async () => {
    let token = null;
    try { token = localStorage.getItem('token'); } catch { /* ignorar */ }
    if (!token) { setCargando(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUsuario(data.usuario);
      setErrorConexion(false);
    } catch (err) {
      if (err.response?.status === 401) {
        try { localStorage.removeItem('token'); } catch { /* ignorar */ }
      } else if (!err.response) {
        setErrorConexion(true); // backend apagado: no cerramos la sesión
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { verificarSesion(); }, [verificarSesion]);

  const guardarSesion = ({ token, usuario: u }) => {
    try { localStorage.setItem('token', token); } catch { /* ignorar */ }
    setUsuario(u);
    setErrorConexion(false);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    guardarSesion(data);
    return data.usuario;
  };

  const registrar = async (datos) => {
    const { data } = await api.post('/auth/registro', datos);
    guardarSesion(data);
    return data.usuario;
  };

  const logout = () => {
    try { localStorage.removeItem('token'); } catch { /* ignorar */ }
    setUsuario(null);
  };

  const valor = useMemo(
    () => ({ usuario, setUsuario, cargando, errorConexion, login, registrar, logout, reintentar: verificarSesion }),
    [usuario, cargando, errorConexion, verificarSesion]
  );

  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
