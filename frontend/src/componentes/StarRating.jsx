import { useState } from 'react';

/**
 * Estrellas.
 *  - Interactiva (por defecto): el usuario elige de 1 a 5 y se llama onChange(n).
 *  - readOnly: muestra un promedio con decimales (ej. 3.7 se pinta parcialmente).
 */
export default function StarRating({ value = 0, onChange, readOnly = false, size = 20, showValue = false, count }) {
  const [hover, setHover] = useState(0);

  if (readOnly) {
    const pct = Math.max(0, Math.min(100, (value / 5) * 100));
    return (
      <span className="stars-ro" title={value ? `${Number(value).toFixed(1)} de 5` : 'Sin calificaciones'}>
        <span className="stars-base" style={{ fontSize: size }} aria-hidden="true">
          ★★★★★
          <span className="stars-top" style={{ width: `${pct}%` }}>★★★★★</span>
        </span>
        {showValue && <b className="stars-num">{value ? Number(value).toFixed(1) : '—'}</b>}
        {count !== undefined && <small className="stars-count">({count})</small>}
      </span>
    );
  }

  const activo = hover || value;
  const etiquetas = ['', 'Muy malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

  return (
    <span className="stars-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= activo ? 'on' : ''}`}
          style={{ fontSize: size }}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange && onChange(n)}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
        >
          ★
        </button>
      ))}
      <span className="stars-hint">{activo ? `${activo}/5 · ${etiquetas[activo]}` : 'Elige tu calificación'}</span>
    </span>
  );
}
