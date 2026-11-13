import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mensajeError } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCatalogo } from '../api/catalogo';
import StarRating from '../componentes/StarRating';
import { Aviso, Spinner, Vacio } from '../componentes/Ui';
import { fmtFecha, fmtFechaHora } from '../utils';

/* ---------------- Resumen ---------------- */
function Resumen() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/estadisticas').then((r) => setD(r.data)).catch((e) => setError(mensajeError(e)));
  }, []);

  if (error) return <Aviso>{error}</Aviso>;
  if (!d) return <Spinner />;
  const max = Math.max(...d.por_programa.map((p) => p.total), 1);

  return (
    <>
      <div className="stats">
        <div className="stat"><b>{d.usuarios}</b><span>Usuarios</span></div>
        <div className="stat"><b>{d.apuntes}</b><span>Apuntes</span></div>
        <div className="stat"><b>{d.publicados}</b><span>Publicados</span></div>
        <div className="stat stat-alerta"><b>{d.reportes_pendientes}</b><span>Reportes pendientes</span></div>
        <div className="stat"><b>{d.comentarios}</b><span>Comentarios</span></div>
      </div>

      <div className="admin-2col">
        <div className="card form-bloque">
          <h3>Apuntes por programa</h3>
          {d.por_programa.length === 0 ? <p className="muted">Sin datos.</p> : d.por_programa.map((p) => (
            <div key={p.nombre} className="barra-fila">
              <span>{p.nombre}</span>
              <div className="barra"><div style={{ width: `${(p.total / max) * 100}%` }} /></div>
              <b>{p.total}</b>
            </div>
          ))}
        </div>
        <div className="card form-bloque">
          <h3>Mejor calificados</h3>
          {d.top.length === 0 ? <p className="muted">Sin datos.</p> : d.top.map((a, i) => (
            <Link key={a._id} to={`/apuntes/${a._id}`} className="top-fila">
              <span className="top-pos">{i + 1}</span>
              <span className="top-titulo">{a.titulo}<small>{a.autor}</small></span>
              <StarRating value={a.promedio} readOnly size={15} showValue />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------------- Reportes ---------------- */
function Reportes() {
  const toast = useToast();
  const [estado, setEstado] = useState('pendiente');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setItems(null);
    setError('');
    try {
      const { data } = await api.get('/admin/reportes', { params: { estado } });
      setItems(data);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [estado]);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (r, accion) => {
    try {
      await api.put(`/admin/reportes/${r._id}`, { accion });
      toast.ok(accion === 'ocultar' ? 'Apunte ocultado' : 'Reporte descartado');
      setItems((l) => l.filter((x) => x._id !== r._id));
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <>
      <div className="chips">
        {['pendiente', 'resuelto', 'descartado'].map((e) => (
          <button key={e} className={estado === e ? 'activa' : ''} onClick={() => setEstado(e)}>{e}s</button>
        ))}
      </div>
      {error && <Aviso onReintentar={cargar}>{error}</Aviso>}
      {!items ? <Spinner /> : items.length === 0 ? (
        <Vacio icono="✅" titulo="Sin reportes" texto={`No hay reportes ${estado}s.`} />
      ) : (
        <div className="lista-tarjetas">
          {items.map((r) => (
            <div key={r._id} className="card reporte">
              <div className="reporte-info">
                <span className="pill pill-orange">{r.motivo}</span>
                <h4>{r.apunte ? <Link to={`/apuntes/${r.apunte._id}`}>{r.apunte.titulo}</Link> : 'Apunte eliminado'}</h4>
                <p className="muted">
                  Autor: {r.apunte?.autor || '—'} · Reportado por {r.reportado_por?.nombre || '—'} · {fmtFechaHora(r.createdAt)}
                </p>
                {r.detalle && <p className="reporte-detalle">“{r.detalle}”</p>}
                {r.resolucion && <p className="muted">Resolución: {r.resolucion}</p>}
              </div>
              {r.estado === 'pendiente' && (
                <div className="reporte-acciones">
                  <button className="btn btn-sm btn-peligro" onClick={() => resolver(r, 'ocultar')}>Ocultar apunte</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => resolver(r, 'descartar')}>Descartar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Apuntes ---------------- */
function Apuntes() {
  const toast = useToast();
  const [estado, setEstado] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/admin/apuntes', { params: { estado: estado || undefined, q: q || undefined } });
      setItems(data);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [estado, q]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  const cambiar = async (a, nuevo) => {
    try {
      await api.put(`/admin/apuntes/${a._id}/estado`, { estado: nuevo });
      setItems((l) => l.map((x) => (x._id === a._id ? { ...x, estado: nuevo } : x)));
      toast.ok('Estado actualizado');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <>
      <div className="barra-filtros">
        <input placeholder="Buscar por título…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="publicado">Publicados</option>
          <option value="borrador">Borradores</option>
          <option value="oculto">Ocultos</option>
        </select>
      </div>
      {error && <Aviso onReintentar={cargar}>{error}</Aviso>}
      {!items ? <Spinner /> : items.length === 0 ? <Vacio titulo="Sin resultados" /> : (
        <div className="card tabla-wrap">
          <table className="tabla">
            <thead><tr><th>Título</th><th>Autor</th><th>Materia</th><th>★</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  <td><Link to={`/apuntes/${a._id}`}>{a.titulo}</Link><small>{fmtFecha(a.createdAt)}</small></td>
                  <td>{a.autor?.nombre}</td>
                  <td>{a.materia?.nombre}</td>
                  <td>{a.promedio ? a.promedio.toFixed(1) : '—'}</td>
                  <td><span className={`pill pill-estado-${a.estado}`}>{a.estado}</span></td>
                  <td className="acciones-fila">
                    {a.estado !== 'publicado' && <button className="btn btn-sm btn-primary" onClick={() => cambiar(a, 'publicado')}>Publicar</button>}
                    {a.estado !== 'oculto' && <button className="btn btn-sm btn-peligro-ghost" onClick={() => cambiar(a, 'oculto')}>Ocultar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------------- Usuarios (solo admin) ---------------- */
function Usuarios() {
  const { usuario: yo } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/usuarios').then((r) => setItems(r.data)).catch((e) => setError(mensajeError(e)));
  }, []);

  const cambiar = async (u, cambios) => {
    try {
      const { data } = await api.put(`/admin/usuarios/${u._id}`, cambios);
      setItems((l) => l.map((x) => (x._id === u._id ? { ...x, rol: data.rol, activo: data.activo } : x)));
      toast.ok('Usuario actualizado');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  if (error) return <Aviso>{error}</Aviso>;
  if (!items) return <Spinner />;

  return (
    <div className="card tabla-wrap">
      <table className="tabla">
        <thead><tr><th>Usuario</th><th>Programa</th><th>Apuntes</th><th>Rol</th><th>Estado</th></tr></thead>
        <tbody>
          {items.map((u) => (
            <tr key={u._id}>
              <td><strong>{u.nombre}</strong><small>{u.email}</small></td>
              <td>{u.programa || '—'}</td>
              <td>{u.apuntes}</td>
              <td>
                <select value={u.rol} disabled={u._id === yo._id} onChange={(e) => cambiar(u, { rol: e.target.value })}>
                  <option value="estudiante">estudiante</option>
                  <option value="moderador">moderador</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <button
                  className={`btn btn-sm ${u.activo ? 'btn-ghost' : 'btn-primary'}`}
                  disabled={u._id === yo._id}
                  onClick={() => cambiar(u, { activo: !u.activo })}
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Catálogo (solo admin) ---------------- */
function Catalogo() {
  const toast = useToast();
  const { programas } = useCatalogo();
  const [prog, setProg] = useState({ nombre: '', codigo: '' });
  const [mat, setMat] = useState({ nombre: '', programa_id: '', semestre: 1 });

  const crearPrograma = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/programas', prog);
      toast.ok('Programa creado. Recarga la página para verlo en las listas.');
      setProg({ nombre: '', codigo: '' });
    } catch (err) { toast.error(mensajeError(err)); }
  };

  const crearMateria = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/materias', mat);
      toast.ok('Materia creada');
      setMat({ ...mat, nombre: '' });
    } catch (err) { toast.error(mensajeError(err)); }
  };

  return (
    <div className="admin-2col">
      <form className="card form-bloque" onSubmit={crearPrograma}>
        <h3>Nuevo programa</h3>
        <label className="campo"><span>Nombre</span><input required value={prog.nombre} onChange={(e) => setProg({ ...prog, nombre: e.target.value })} /></label>
        <label className="campo"><span>Código</span><input value={prog.codigo} onChange={(e) => setProg({ ...prog, codigo: e.target.value })} placeholder="Ej: ISIS" /></label>
        <button className="btn btn-primary">Crear programa</button>
      </form>
      <form className="card form-bloque" onSubmit={crearMateria}>
        <h3>Nueva materia</h3>
        <label className="campo"><span>Programa</span>
          <select required value={mat.programa_id} onChange={(e) => setMat({ ...mat, programa_id: e.target.value })}>
            <option value="">Selecciona…</option>
            {programas.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
          </select>
        </label>
        <div className="fila-2">
          <label className="campo"><span>Nombre</span><input required value={mat.nombre} onChange={(e) => setMat({ ...mat, nombre: e.target.value })} /></label>
          <label className="campo"><span>Semestre</span><input type="number" min={1} max={12} value={mat.semestre} onChange={(e) => setMat({ ...mat, semestre: e.target.value })} /></label>
        </div>
        <button className="btn btn-primary">Crear materia</button>
      </form>
    </div>
  );
}

/* ---------------- Contenedor ---------------- */
export default function AdminDashboard() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';
  const [tab, setTab] = useState('resumen');

  const tabs = [
    ['resumen', '📊 Resumen'],
    ['reportes', '🚩 Reportes'],
    ['apuntes', '📄 Apuntes'],
    ...(esAdmin ? [['usuarios', '👥 Usuarios'], ['catalogo', '🏷️ Catálogo']] : [])
  ];

  return (
    <>
      <div className="pagina-cab">
        <div>
          <h1>Panel de administración</h1>
          <p className="muted">Modera contenido, gestiona usuarios y revisa las estadísticas.</p>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(([k, t]) => <button key={k} className={tab === k ? 'activa' : ''} onClick={() => setTab(k)}>{t}</button>)}
      </div>
      {tab === 'resumen' && <Resumen />}
      {tab === 'reportes' && <Reportes />}
      {tab === 'apuntes' && <Apuntes />}
      {tab === 'usuarios' && esAdmin && <Usuarios />}
      {tab === 'catalogo' && esAdmin && <Catalogo />}
    </>
  );
}
