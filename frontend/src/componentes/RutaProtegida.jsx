import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Ui';

export default function RutaProtegida({ children, roles }) {
  const { usuario, cargando, errorConexion, reintentar } = useAuth();
  const location = useLocation();

  if (cargando) return <div className="pantalla-centro"><Spinner texto="Verificando sesión…" /></div>;

  if (!usuario && errorConexion) {
    return (
      <div className="pantalla-centro">
        <div className="card caja-error">
          <h2>Sin conexión con el servidor</h2>
          <p>No se pudo contactar al backend. Enciéndelo con <code>npm run dev</code> en la carpeta del servidor y vuelve a intentar.</p>
          <button className="btn btn-primary" onClick={reintentar}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}
