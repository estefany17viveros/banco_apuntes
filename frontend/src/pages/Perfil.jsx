import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mensajeError } from '../api/axiosInstance';
import { useCatalogo } from '../api/catalogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ApunteCard from '../componentes/ApunteCard';
import { Avatar, Aviso, Spinner, Vacio } from '../componentes/Ui';
import { fmtFecha } from '../utils';

export default function Perfil() {
  const { usuario, setUsuario } = useAuth();
  const toast = useToast();
  const { programas } = useCatalogo();
  const [tab, setTab] = useState('apuntes');
  const [apuntes, setApuntes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: usuario.nombre, programa_id: usuario.programa_id || '', password_actual: '', password_nueva: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { data } = await api.get('/apuntes/mios');
      setApuntes(data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const stats = useMemo(() => {
    const publicados = apuntes.filter((a) => a.estado === 'publicado');
    const conNota = publicados.filter((a) => a.num_calificaciones > 0);
    const promedio = conNota.length ? conNota.reduce((s, a) => s + a.promedio, 0) / conNota.length : 0;
    return {
      total: apuntes.length,
      publicados: publicados.length,
      borradores: apuntes.filter((a) => a.estado === 'borrador').length,
      promedio,
      favoritos: apuntes.reduce((s, a) => s + a.num_favoritos, 0)
    };
  }, [apuntes]);

  const cambiarEstado = async (a, estado) => {
    const fd = new FormData();
    fd.append('estado', estado);
    try {
      await api.put(`/apuntes/${a._id}`, fd);
      setApuntes((l) => l.map((x) => (x._id === a._id ? { ...x, estado } : x)));
      toast.ok(estado === 'publicado' ? 'Apunte publicado' : 'Apunte guardado como borrador');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const eliminar = async (a) => {
    if (!window.confirm(`¿Eliminar "${a.titulo}"? No se puede deshacer.`)) return;
    try {
      await api.delete(`/apuntes/${a._id}`);
      setApuntes((l) => l.filter((x) => x._id !== a._id));
      toast.ok('Apunte eliminado');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const cuerpo = { nombre: form.nombre, programa_id: form.programa_id };
      if (form.password_nueva) Object.assign(cuerpo, { password_actual: form.password_actual, password_nueva: form.password_nueva });
      const { data } = await api.put('/auth/me', cuerpo);
      setUsuario(data.usuario);
      setForm((f) => ({ ...f, password_actual: '', password_nueva: '' }));
      toast.ok('Perfil actualizado');
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const programaNombre = programas.find((p) => p._id === usuario.programa_id)?.nombre;

  return (
    <>
      <section className="perfil-cab card">
        <Avatar nombre={usuario.nombre} size={76} />
        <div className="perfil-datos">
          <h1>{usuario.nombre}</h1>
          <p className="muted">{usuario.email}</p>
          <div className="detalle-pills">
            <span className="pill pill-blue">{usuario.rol}</span>
            {programaNombre && <span className="pill">{programaNombre}</span>}
            <span className="pill">Miembro desde {fmtFecha(usuario.createdAt)}</span>
          </div>
        </div>
        <Link to="/crear" className="btn btn-accent">＋ Nuevo apunte</Link>
      </section>

      <section className="stats">
        <div className="stat"><b>{stats.total}</b><span>Apuntes</span></div>
        <div className="stat"><b>{stats.publicados}</b><span>Publicados</span></div>
        <div className="stat"><b>{stats.borradores}</b><span>Borradores</span></div>
        <div className="stat"><b>{stats.promedio ? stats.promedio.toFixed(1) : '—'}</b><span>Promedio ★</span></div>
        <div className="stat"><b>{stats.favoritos}</b><span>Veces guardados</span></div>
      </section>

      <div className="tabs">
        <button className={tab === 'apuntes' ? 'activa' : ''} onClick={() => setTab('apuntes')}>Mis apuntes</button>
        <button className={tab === 'cuenta' ? 'activa' : ''} onClick={() => setTab('cuenta')}>Editar perfil</button>
      </div>

      {tab === 'apuntes' && (
        <>
          {error && <Aviso onReintentar={cargar}>{error}</Aviso>}
          {cargando ? <Spinner /> : apuntes.length === 0 && !error ? (
            <Vacio icono="✍️" titulo="Aún no has subido apuntes" texto="Comparte tu primer apunte con la comunidad.">
              <Link to="/crear" className="btn btn-accent">Subir apunte</Link>
            </Vacio>
          ) : (
            <div className="grid-apuntes">
              {apuntes.map((a) => (
                <div key={a._id} className="apunte-envoltorio">
                  <ApunteCard apunte={a} />
                  <div className="apunte-acciones">
                    <Link to={`/apuntes/${a._id}/editar`} className="btn btn-sm btn-ghost">✏️ Editar</Link>
                    {a.estado === 'borrador' && <button className="btn btn-sm btn-primary" onClick={() => cambiarEstado(a, 'publicado')}>Publicar</button>}
                    {a.estado === 'publicado' && <button className="btn btn-sm btn-ghost" onClick={() => cambiarEstado(a, 'borrador')}>A borrador</button>}
                    <button className="btn btn-sm btn-peligro-ghost" onClick={() => eliminar(a)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'cuenta' && (
        <form className="card form-bloque form-cuenta" onSubmit={guardarPerfil}>
          <label className="campo"><span>Nombre</span>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </label>
          <label className="campo"><span>Programa académico</span>
            <select value={form.programa_id} onChange={(e) => setForm({ ...form, programa_id: e.target.value })}>
              <option value="">Sin programa</option>
              {programas.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
            </select>
          </label>
          <h3>Cambiar contraseña</h3>
          <div className="fila-2">
            <label className="campo"><span>Contraseña actual</span>
              <input type="password" value={form.password_actual} onChange={(e) => setForm({ ...form, password_actual: e.target.value })} />
            </label>
            <label className="campo"><span>Nueva contraseña</span>
              <input type="password" minLength={6} value={form.password_nueva} onChange={(e) => setForm({ ...form, password_nueva: e.target.value })} />
            </label>
          </div>
          <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </form>
      )}
    </>
  );
}
