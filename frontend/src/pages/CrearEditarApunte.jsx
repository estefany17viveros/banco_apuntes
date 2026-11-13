import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { mensajeError } from '../api/axiosInstance';
import { useCatalogo, useMaterias } from '../api/catalogo';
import { useToast } from '../context/ToastContext';
import FileUploader from '../componentes/FileUploader';
import { Aviso, Spinner } from '../componentes/Ui';
import { ICONO_TIPO, fmtTam, tipoArchivo } from '../utils';

const VACIO = { titulo: '', contenido: '', programa_id: '', materia_id: '', metodologia_id: '', etiquetas: '', estado: 'publicado' };

export default function CrearEditarApunte() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { programas, metodologias } = useCatalogo();

  const [form, setForm] = useState(VACIO);
  const [nuevos, setNuevos] = useState([]);            // archivos nuevos (File)
  const [existentes, setExistentes] = useState([]);    // archivos ya guardados (edición)
  const [quitar, setQuitar] = useState([]);            // ids de archivos a eliminar
  const [cargando, setCargando] = useState(editando);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const materias = useMaterias(form.programa_id);

  useEffect(() => {
    if (!editando) return;
    api.get(`/apuntes/${id}`)
      .then(({ data: a }) => {
        setForm({
          titulo: a.titulo,
          contenido: a.contenido || '',
          programa_id: a.programa?._id || '',
          materia_id: a.materia?._id || '',
          metodologia_id: a.metodologia?._id || '',
          etiquetas: (a.etiquetas || []).join(', '),
          estado: a.estado === 'borrador' ? 'borrador' : 'publicado'
        });
        setExistentes(a.archivos || []);
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [id, editando]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => ({ ...f, [campo]: valor, ...(campo === 'programa_id' ? { materia_id: '' } : {}) }));
  };

  const etiquetasLista = form.etiquetas.split(',').map((t) => t.trim()).filter(Boolean);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.titulo.trim()) return setError('Escribe un título para el apunte.');
    if (!form.programa_id || !form.materia_id) return setError('Selecciona el programa y la materia.');
    const archivosRestantes = existentes.filter((x) => !quitar.includes(x._id)).length + nuevos.length;
    if (!form.contenido.trim() && archivosRestantes === 0) {
      return setError('Escribe el contenido o adjunta al menos un archivo.');
    }

    // Todo viaja como multipart/form-data: los archivos se guardan en el servidor y en la base de datos
    const fd = new FormData();
    fd.append('titulo', form.titulo.trim());
    fd.append('contenido', form.contenido);
    fd.append('programa_id', form.programa_id);
    fd.append('materia_id', form.materia_id);
    fd.append('metodologia_id', form.metodologia_id);
    fd.append('etiquetas', JSON.stringify(etiquetasLista));
    fd.append('estado', form.estado);
    if (quitar.length) fd.append('eliminar_archivos', JSON.stringify(quitar));
    nuevos.forEach((f) => fd.append('archivos', f));

    setGuardando(true);
    try {
      const { data } = editando ? await api.put(`/apuntes/${id}`, fd) : await api.post('/apuntes', fd);
      toast.ok(editando ? 'Apunte actualizado' : form.estado === 'borrador' ? 'Borrador guardado' : '¡Apunte publicado!');
      navigate(`/apuntes/${data._id}`);
    } catch (err) {
      setError(mensajeError(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spinner />;

  return (
    <form className="form-apunte" onSubmit={guardar}>
      <div className="pagina-cab">
        <div>
          <h1>{editando ? 'Editar apunte' : 'Subir un apunte'}</h1>
          <p className="muted">Comparte tu material con la comunidad. Puedes escribir texto, adjuntar archivos o ambos.</p>
        </div>
      </div>

      {error && <Aviso>{error}</Aviso>}

      <div className="form-grid">
        <div className="card form-bloque">
          <h3>Información</h3>
          <label className="campo"><span>Título *</span>
            <input value={form.titulo} onChange={cambiar('titulo')} maxLength={160} placeholder="Ej: Normalización de bases de datos (1FN a 3FN)" />
          </label>

          <div className="fila-2">
            <label className="campo"><span>Programa *</span>
              <select value={form.programa_id} onChange={cambiar('programa_id')}>
                <option value="">Selecciona…</option>
                {programas.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
              </select>
            </label>
            <label className="campo"><span>Materia *</span>
              <select value={form.materia_id} onChange={cambiar('materia_id')} disabled={!form.programa_id}>
                <option value="">{form.programa_id ? 'Selecciona…' : 'Primero elige un programa'}</option>
                {materias.map((m) => <option key={m._id} value={m._id}>{m.nombre}</option>)}
              </select>
            </label>
          </div>

          <label className="campo"><span>Metodología de estudio</span>
            <select value={form.metodologia_id} onChange={cambiar('metodologia_id')}>
              <option value="">Ninguna</option>
              {metodologias.map((m) => <option key={m._id} value={m._id}>{m.nombre}</option>)}
            </select>
          </label>

          <label className="campo"><span>Etiquetas (separadas por coma)</span>
            <input value={form.etiquetas} onChange={cambiar('etiquetas')} placeholder="parcial, sql, resumen" />
          </label>
          {etiquetasLista.length > 0 && (
            <div className="tags">{etiquetasLista.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
          )}

          <label className="campo"><span>Contenido</span>
            <textarea rows={11} value={form.contenido} onChange={cambiar('contenido')} placeholder="Escribe aquí tu apunte…" />
          </label>
        </div>

        <div className="form-lateral">
          <div className="card form-bloque">
            <h3>Archivos</h3>
            {existentes.length > 0 && (
              <ul className="lista-archivos">
                {existentes.map((f) => {
                  const marcado = quitar.includes(f._id);
                  return (
                    <li key={f._id} className={marcado ? 'tachado' : ''}>
                      <span className="archivo-ico">{ICONO_TIPO[tipoArchivo(f.mimetype, f.nombre)]}</span>
                      <span className="archivo-nombre">{f.nombre}</span>
                      <small>{fmtTam(f.tamano)}</small>
                      <button type="button" className="btn btn-sm btn-ghost"
                        onClick={() => setQuitar(marcado ? quitar.filter((x) => x !== f._id) : [...quitar, f._id])}>
                        {marcado ? 'Deshacer' : 'Quitar'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <FileUploader archivos={nuevos} onChange={setNuevos} cupo={10 - (existentes.length - quitar.length)} onError={(m) => toast.error(m)} />
          </div>

          <div className="card form-bloque">
            <h3>Publicación</h3>
            <label className="opcion"><input type="radio" name="estado" checked={form.estado === 'publicado'} onChange={() => setForm({ ...form, estado: 'publicado' })} />
              <span><strong>Publicar ahora</strong><small>Visible para todos los estudiantes</small></span></label>
            <label className="opcion"><input type="radio" name="estado" checked={form.estado === 'borrador'} onChange={() => setForm({ ...form, estado: 'borrador' })} />
              <span><strong>Guardar como borrador</strong><small>Solo tú lo verás</small></span></label>
            <button className="btn btn-accent btn-block btn-lg" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : form.estado === 'borrador' ? 'Guardar borrador' : 'Publicar apunte'}
            </button>
            <Link to={editando ? `/apuntes/${id}` : '/'} className="btn btn-ghost btn-block">Cancelar</Link>
          </div>
        </div>
      </div>
    </form>
  );
}
