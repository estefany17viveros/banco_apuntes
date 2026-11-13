import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { mensajeError } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../componentes/StarRating';
import ArchivosAdjuntos from '../componentes/ArchivosAdjuntos';
import { Avatar, Aviso, Modal, Spinner } from '../componentes/Ui';
import { fmtFecha, fmtFechaHora } from '../utils';

const MOTIVOS = ['Contenido incorrecto', 'Contenido inapropiado', 'Plagio o derechos de autor', 'Spam o publicidad', 'Archivo dañado', 'Otro'];

export default function ApunteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();

  const [apunte, setApunte] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevo, setNuevo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reporte, setReporte] = useState(null); // null = cerrado
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [a, c] = await Promise.all([api.get(`/apuntes/${id}`), api.get(`/apuntes/${id}/comentarios`)]);
      setApunte(a.data);
      setComentarios(c.data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { cargar(); window.scrollTo(0, 0); }, [cargar]);

  if (cargando) return <Spinner />;
  if (error || !apunte) {
    return (
      <>
        <Aviso onReintentar={cargar}>{error || 'No se pudo cargar el apunte.'}</Aviso>
        <Link to="/" className="btn btn-ghost">← Volver a explorar</Link>
      </>
    );
  }

  const esDueno = apunte.autor?._id === usuario._id;
  const puedeGestionar = esDueno || ['admin', 'moderador'].includes(usuario.rol);

  /* ---- Calificar ---- */
  const calificar = async (n) => {
    const anterior = apunte.mi_calificacion;
    setApunte((a) => ({ ...a, mi_calificacion: n })); // optimista
    try {
      const { data } = await api.post(`/apuntes/${id}/calificar`, { puntuacion: n });
      setApunte((a) => ({ ...a, mi_calificacion: data.mi_calificacion, promedio: data.promedio, num_calificaciones: data.num_calificaciones }));
      toast.ok(`Calificaste con ${n} ${n === 1 ? 'estrella' : 'estrellas'}`);
    } catch (err) {
      setApunte((a) => ({ ...a, mi_calificacion: anterior }));
      toast.error(mensajeError(err));
    }
  };

  /* ---- Favorito ---- */
  const favorito = async () => {
    try {
      const { data } = await api.post(`/apuntes/${id}/favorito`);
      setApunte((a) => ({ ...a, es_favorito: data.es_favorito, num_favoritos: data.num_favoritos }));
      toast.ok(data.es_favorito ? 'Guardado en favoritos' : 'Quitado de favoritos');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  /* ---- Comentarios ---- */
  const comentar = async (e) => {
    e.preventDefault();
    if (!nuevo.trim()) return;
    setEnviando(true);
    try {
      const { data } = await api.post(`/apuntes/${id}/comentarios`, { contenido: nuevo });
      setComentarios((l) => [data, ...l]);
      setApunte((a) => ({ ...a, num_comentarios: a.num_comentarios + 1 }));
      setNuevo('');
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const borrarComentario = async (c) => {
    try {
      await api.delete(`/comentarios/${c._id}`);
      setComentarios((l) => l.filter((x) => x._id !== c._id));
      setApunte((a) => ({ ...a, num_comentarios: Math.max(a.num_comentarios - 1, 0) }));
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  /* ---- Reportar ---- */
  const enviarReporte = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/apuntes/${id}/reportar`, reporte);
      toast.ok(data.message);
      setReporte(null);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  /* ---- Eliminar ---- */
  const eliminar = async () => {
    try {
      await api.delete(`/apuntes/${id}`);
      toast.ok('Apunte eliminado');
      navigate('/perfil');
    } catch (err) {
      toast.error(mensajeError(err));
      setConfirmarBorrado(false);
    }
  };

  return (
    <div className="detalle">
      <Link to="/" className="volver">← Volver</Link>

      {apunte.estado !== 'publicado' && (
        <Aviso tipo="info">
          Este apunte está en estado <b>{apunte.estado}</b>
          {apunte.estado === 'oculto' ? ' (ocultado por moderación).' : ' y solo tú puedes verlo.'}
        </Aviso>
      )}

      <div className="detalle-grid">
        <article className="card detalle-principal">
          <div className="detalle-pills">
            <span className="pill pill-blue">{apunte.materia?.nombre}</span>
            <span className="pill">{apunte.programa?.nombre}</span>
            {apunte.metodologia && <span className="pill pill-orange">{apunte.metodologia.nombre}</span>}
          </div>
          <h1>{apunte.titulo}</h1>
          <div className="detalle-meta">
            <Avatar nombre={apunte.autor?.nombre} size={30} />
            <span><strong>{apunte.autor?.nombre}</strong> · {fmtFecha(apunte.createdAt)} · 👁 {apunte.vistas} vistas</span>
          </div>

          {apunte.etiquetas.length > 0 && (
            <div className="tags">{apunte.etiquetas.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
          )}

          {apunte.contenido && <div className="contenido-texto">{apunte.contenido}</div>}

          {apunte.archivos.length > 0 && (
            <>
              <h3 className="subtitulo">Archivos adjuntos ({apunte.archivos.length})</h3>
              <ArchivosAdjuntos archivos={apunte.archivos} />
            </>
          )}
        </article>

        <aside className="detalle-lateral">
          <div className="card panel-valoracion">
            <div className="promedio">
              <span className="promedio-num">{apunte.promedio ? apunte.promedio.toFixed(1) : '—'}</span>
              <div>
                <StarRating value={apunte.promedio} readOnly size={22} />
                <small>{apunte.num_calificaciones} {apunte.num_calificaciones === 1 ? 'calificación' : 'calificaciones'}</small>
              </div>
            </div>
            <hr />
            <strong className="mi-cal-titulo">{apunte.mi_calificacion ? 'Tu calificación' : '¿Qué te pareció?'}</strong>
            <StarRating value={apunte.mi_calificacion} onChange={calificar} size={30} />

            <div className="acciones">
              <button className={`btn btn-block ${apunte.es_favorito ? 'btn-accent' : 'btn-ghost'}`} onClick={favorito}>
                {apunte.es_favorito ? '♥ En favoritos' : '♡ Guardar en favoritos'} · {apunte.num_favoritos}
              </button>
              {!esDueno && (
                <button className="btn btn-ghost btn-block" onClick={() => setReporte({ motivo: MOTIVOS[0], detalle: '' })}>
                  🚩 Reportar apunte
                </button>
              )}
              {puedeGestionar && (
                <>
                  <Link to={`/apuntes/${id}/editar`} className="btn btn-ghost btn-block">✏️ Editar</Link>
                  <button className="btn btn-peligro btn-block" onClick={() => setConfirmarBorrado(true)}>🗑 Eliminar</button>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="card comentarios">
        <h3>Comentarios ({comentarios.length})</h3>
        <form className="comentar-form" onSubmit={comentar}>
          <Avatar nombre={usuario.nombre} />
          <textarea rows={2} value={nuevo} maxLength={1000} onChange={(e) => setNuevo(e.target.value)} placeholder="Escribe un comentario…" />
          <button className="btn btn-primary" disabled={enviando || !nuevo.trim()}>Comentar</button>
        </form>

        {comentarios.length === 0 ? (
          <p className="muted centro">Sé el primero en comentar.</p>
        ) : (
          <ul className="lista-comentarios">
            {comentarios.map((c) => (
              <li key={c._id}>
                <Avatar nombre={c.usuario?.nombre} size={34} />
                <div className="comentario-cuerpo">
                  <div><strong>{c.usuario?.nombre || 'Usuario'}</strong> <small>{fmtFechaHora(c.createdAt)}</small></div>
                  <p>{c.contenido}</p>
                </div>
                {(c.usuario?._id === usuario._id || ['admin', 'moderador'].includes(usuario.rol)) && (
                  <button className="icon-btn" onClick={() => borrarComentario(c)} title="Eliminar comentario">🗑</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {reporte && (
        <Modal titulo="Reportar apunte" onCerrar={() => setReporte(null)}>
          <form onSubmit={enviarReporte} className="form-modal">
            <label className="campo"><span>Motivo</span>
              <select value={reporte.motivo} onChange={(e) => setReporte({ ...reporte, motivo: e.target.value })}>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label className="campo"><span>Detalle (opcional)</span>
              <textarea rows={3} value={reporte.detalle} onChange={(e) => setReporte({ ...reporte, detalle: e.target.value })} />
            </label>
            <div className="modal-acciones">
              <button type="button" className="btn btn-ghost" onClick={() => setReporte(null)}>Cancelar</button>
              <button className="btn btn-peligro">Enviar reporte</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmarBorrado && (
        <Modal titulo="¿Eliminar este apunte?" onCerrar={() => setConfirmarBorrado(false)}>
          <p>Se borrarán también sus archivos, calificaciones y comentarios. Esta acción no se puede deshacer.</p>
          <div className="modal-acciones">
            <button className="btn btn-ghost" onClick={() => setConfirmarBorrado(false)}>Cancelar</button>
            <button className="btn btn-peligro" onClick={eliminar}>Sí, eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
