import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensajeError } from '../api/axiosInstance';
import { Aviso } from '../componentes/Ui';

export function PanelMarca() {
  return (
    <div className="auth-marca">
      <div className="brand brand-grande">
        <span className="brand-logo">📚</span>
        <div><strong>BancoApuntes</strong><small>Universidad del Cauca</small></div>
      </div>
      <h1>Estudia mejor, comparte tus apuntes.</h1>
      <ul>
        <li>📄 Sube PDF, imágenes, audio y video directo desde tu computador</li>
        <li>⭐ Califica y descubre los mejores apuntes de tu carrera</li>
        <li>♥ Guarda tus favoritos y encuéntralos cuando los necesites</li>
      </ul>
    </div>
  );
}

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-pagina">
      <PanelMarca />
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={enviar}>
          <h2>Iniciar sesión</h2>
          <p className="muted">Ingresa con tu cuenta para ver y subir apuntes.</p>
          {error && <Aviso>{error}</Aviso>}

          <label className="campo">
            <span>Correo</span>
            <input type="email" required autoFocus placeholder="tucorreo@unicauca.edu.co" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input type="password" required placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>

          <button className="btn btn-primary btn-block btn-lg" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Entrar'}
          </button>
          <p className="auth-cambio">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>

          <div className="demo-box">
            <strong>Cuentas de prueba</strong>
            <button type="button" onClick={() => setForm({ email: 'maria@unicauca.edu.co', password: 'Estudiante123*' })}>Estudiante</button>
            <button type="button" onClick={() => setForm({ email: 'admin@unicauca.edu.co', password: 'Admin123*' })}>Admin</button>
          </div>
        </form>
      </div>
    </div>
  );
}
