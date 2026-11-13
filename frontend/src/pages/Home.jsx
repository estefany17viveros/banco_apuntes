import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mensajeError } from '../api/axiosInstance';
import { useCatalogo, useMaterias } from '../api/catalogo';
import { useToast } from '../context/ToastContext';
import ApunteCard from '../componentes/ApunteCard';
import { Aviso, Spinner, Vacio } from '../componentes/Ui';

const FILTROS_INICIALES = { q: '', programa: '', materia: '', metodologia: '', orden: 'recientes' };

export default function Home() {
  const toast = useToast();
  const { programas, metodologias } = useCatalogo();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [resultado, setResultado] = useState({ data: [], total: 0, pages: 1 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const materias = useMaterias(filtros.programa);

  // Espera 350 ms después de escribir para buscar
  useEffect(() => {
    const t = setTimeout(() => { setFiltros((f) => ({ ...f, q: busqueda })); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = { ...filtros, page, limit: 9 };
      Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
      const { data } = await api.get('/apuntes', { params });
      setResultado(data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }, [filtros, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarFiltro = (campo) => (e) => {
    const valor = e.target.value;
    setPage(1);
    setFiltros((f) => ({ ...f, [campo]: valor, ...(campo === 'programa' ? { materia: '' } : {}) }));
  };

  const alternarFavorito = async (apunte) => {
    const anterior = apunte.es_favorito;
    const actualizar = (fav, num) =>
      setResultado((r) => ({
        ...r,
        data: r.data.map((a) => (a._id === apunte._id ? { ...a, es_favorito: fav, num_favoritos: num ?? a.num_favoritos } : a))
      }));
    actualizar(!anterior); // optimista
    try {
      const { data } = await api.post(`/apuntes/${apunte._id}/favorito`);
      actualizar(data.es_favorito, data.num_favoritos);
      toast.ok(data.es_favorito ? 'Guardado en favoritos' : 'Quitado de favoritos');
    } catch (err) {
      actualizar(anterior);
      toast.error(mensajeError(err));
    }
  };

  const hayFiltros = filtros.q || filtros.programa || filtros.materia || filtros.metodologia;

  return (
    <>
      <section className="hero">
        <div>
          <h1>Encuentra los mejores apuntes de tu carrera</h1>
          <p>{resultado.total} apuntes compartidos por estudiantes de la Universidad del Cauca.</p>
        </div>
        <div className="hero-buscador">
          <span>🔎</span>
          <input
            placeholder="Busca por título, contenido o etiqueta…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </section>

      <section className="filtros card">
        <label className="campo campo-sm"><span>Programa</span>
          <select value={filtros.programa} onChange={cambiarFiltro('programa')}>
            <option value="">Todos</option>
            {programas.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
          </select>
        </label>
        <label className="campo campo-sm"><span>Materia</span>
          <select value={filtros.materia} onChange={cambiarFiltro('materia')} disabled={!filtros.programa}>
            <option value="">{filtros.programa ? 'Todas' : 'Elige un programa'}</option>
            {materias.map((m) => <option key={m._id} value={m._id}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="campo campo-sm"><span>Metodología</span>
          <select value={filtros.metodologia} onChange={cambiarFiltro('metodologia')}>
            <option value="">Todas</option>
            {metodologias.map((m) => <option key={m._id} value={m._id}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="campo campo-sm"><span>Ordenar por</span>
          <select value={filtros.orden} onChange={cambiarFiltro('orden')}>
            <option value="recientes">Más recientes</option>
            <option value="mejor">Mejor calificados</option>
            <option value="populares">Más guardados</option>
          </select>
        </label>
        {hayFiltros && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setBusqueda(''); setFiltros(FILTROS_INICIALES); setPage(1); }}>
            Limpiar filtros
          </button>
        )}
      </section>

      {error && <Aviso onReintentar={cargar}>{error}</Aviso>}

      {cargando ? (
        <Spinner texto="Buscando apuntes…" />
      ) : resultado.data.length === 0 && !error ? (
        <Vacio icono="🗂️" titulo="No encontramos apuntes" texto={hayFiltros ? 'Prueba con otros filtros o palabras.' : 'Sé el primero en compartir uno.'}>
          <Link to="/crear" className="btn btn-accent">Subir un apunte</Link>
        </Vacio>
      ) : (
        <>
          <div className="grid-apuntes">
            {resultado.data.map((a) => <ApunteCard key={a._id} apunte={a} onFavorito={alternarFavorito} />)}
          </div>
          {resultado.pages > 1 && (
            <div className="paginacion">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Anterior</button>
              <span>Página {page} de {resultado.pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= resultado.pages} onClick={() => setPage(page + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
