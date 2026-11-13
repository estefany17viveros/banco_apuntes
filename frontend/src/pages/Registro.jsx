import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensajeError } from '../api/axiosInstance';
import { useCatalogo } from '../api/catalogo';
import { Aviso } from '../componentes/Ui';
import { PanelMarca } from './Login';

export default function Registro() {
  const { usuario, registrar } = useAuth();
  const navigate = useNavigate();
  const { programas } = useCatalogo();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', programa_id: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await registrar(form);
      navigate('/', { replace: true });
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
          <h2>Crear cuenta</h2>
          <p className="muted">Es gratis y toma menos de un minuto.</p>
          {error && <Aviso>{error}</Aviso>}

          <label className="campo"><span>Nombre completo</span>
            <input required value={form.nombre} onChange={cambiar('nombre')} placeholder="Ej: Ana Gómez" />
          </label>
          <label className="campo"><span>Correo</span>
            <input type="email" required value={form.email} onChange={cambiar('email')} placeholder="tucorreo@unicauca.edu.co" />
          </label>
          <label className="campo"><span>Programa académico</span>
            <select value={form.programa_id} onChange={cambiar('programa_id')}>
              <option value="">Selecciona (opcional)</option>
              {programas.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
            </select>
          </label>
          <label className="campo"><span>Contraseña</span>
            <input type="password" required minLength={6} value={form.password} onChange={cambiar('password')} placeholder="Mínimo 6 caracteres" />
          </label>

          <button className="btn btn-primary btn-block btn-lg" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Registrarme'}
          </button>
          <p className="auth-cambio">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </form>
      </div>
    </div>
  );
}
