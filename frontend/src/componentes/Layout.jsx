import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { Avatar } from './Ui';
import { fmtFechaHora } from '../utils';

const ICONO_NOTIF = { comentario: '💬', calificacion: '⭐', favorito: '♥', moderacion: '🛡️' };

function Campana() {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState({ items: [], no_leidas: 0 });
  const navigate = useNavigate();
  const ref = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/notificaciones');
      setDatos(data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  const alternar = async () => {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo) {
      await cargar();
      if (datos.no_leidas) {
        api.put('/notificaciones/leer-todas').then(() => setDatos((d) => ({ ...d, no_leidas: 0 }))).catch(() => {});
      }
    }
  };

  return (
    <div className="campana" ref={ref}>
      <button className="icon-btn campana-btn" onClick={alternar} aria-label="Notificaciones">
        🔔{datos.no_leidas > 0 && <span className="campana-badge">{datos.no_leidas > 9 ? '9+' : datos.no_leidas}</span>}
      </button>
      {abierto && (
        <div className="campana-panel card">
          <div className="campana-cab">Notificaciones</div>
          {datos.items.length === 0 ? (
            <div className="campana-vacia">Aún no tienes notificaciones.</div>
          ) : (
            datos.items.map((n) => (
              <button
                key={n._id}
                className={`notif ${n.leida ? '' : 'nueva'}`}
                onClick={() => { setAbierto(false); if (n.apunte_id) navigate(`/apuntes/${n.apunte_id}`); }}
              >
                <span>{ICONO_NOTIF[n.tipo] || '🔔'}</span>
                <span className="notif-txt">
                  {n.mensaje}
                  <small>{fmtFechaHora(n.createdAt)}</small>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMenu(false); }, [location.pathname]);

  const salir = () => { logout(); navigate('/login'); };
  const esMod = ['admin', 'moderador'].includes(usuario.rol);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? 'abierto' : ''}`}>
        <div className="brand">
          <span className="brand-logo">📚</span>
          <div>
            <strong>BancoApuntes</strong>
            <small>Unicauca</small>
          </div>
        </div>

        <NavLink to="/crear" className="btn btn-accent btn-block nav-cta">＋ Subir apunte</NavLink>

        <nav className="nav">
          <NavLink to="/" end><span>🔎</span> Explorar</NavLink>
          <NavLink to="/favoritos"><span>♥</span> Favoritos</NavLink>
          <NavLink to="/perfil"><span>👤</span> Mi perfil</NavLink>
          {esMod && <NavLink to="/admin"><span>🛡️</span> Administración</NavLink>}
        </nav>

        <div className="sidebar-pie">
          <div className="user-chip">
            <Avatar nombre={usuario.nombre} />
            <div>
              <strong>{usuario.nombre}</strong>
              <small>{usuario.rol}</small>
            </div>
          </div>
          <button className="btn btn-ghost-dark btn-block" onClick={salir}>Cerrar sesión</button>
        </div>
      </aside>

      {menu && <div className="sidebar-fondo" onClick={() => setMenu(false)} />}

      <div className="contenido">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="Abrir menú">☰</button>
          <div className="topbar-saludo">Hola, <strong>{usuario.nombre.split(' ')[0]}</strong> 👋</div>
          <Campana />
        </header>
        <main className="pagina">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
