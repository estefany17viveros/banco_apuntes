import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { fmtFecha, resumen } from '../utils';

export default function ApunteCard({ apunte, onFavorito }) {
  const a = apunte;
  return (
    <article className="card apunte-card">
      <div className="apunte-card-top">
        <span className="pill pill-blue">{a.materia?.nombre || 'Sin materia'}</span>
        {a.estado !== 'publicado' && <span className={`pill pill-estado-${a.estado}`}>{a.estado}</span>}
        {onFavorito && (
          <button
            className={`fav-btn ${a.es_favorito ? 'on' : ''}`}
            onClick={() => onFavorito(a)}
            title={a.es_favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            aria-pressed={a.es_favorito}
          >
            {a.es_favorito ? '♥' : '♡'}
          </button>
        )}
      </div>

      <Link to={`/apuntes/${a._id}`} className="apunte-titulo">{a.titulo}</Link>
      <p className="apunte-resumen">{resumen(a.contenido) || 'Apunte con archivos adjuntos.'}</p>

      {a.etiquetas?.length > 0 && (
        <div className="tags">
          {a.etiquetas.slice(0, 4).map((t) => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}

      <div className="apunte-rating">
        <StarRating value={a.promedio} readOnly size={17} showValue count={a.num_calificaciones} />
      </div>

      <div className="apunte-pie">
        <span>{a.autor?.nombre || 'Anónimo'} · {fmtFecha(a.createdAt)}</span>
        <span className="apunte-stats">
          {a.archivos?.length > 0 && <span title="Archivos">📎 {a.archivos.length}</span>}
          <span title="Comentarios">💬 {a.num_comentarios}</span>
          <span title="Favoritos">♥ {a.num_favoritos}</span>
        </span>
      </div>
    </article>
  );
}
