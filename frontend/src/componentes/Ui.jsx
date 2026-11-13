import { useEffect } from 'react';

export function Spinner({ texto = 'Cargando…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>{texto}</span>
    </div>
  );
}

export function Vacio({ icono = '📭', titulo, texto, children }) {
  return (
    <div className="vacio">
      <div className="vacio-icono">{icono}</div>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}

export function Aviso({ tipo = 'error', children, onReintentar }) {
  return (
    <div className={`aviso aviso-${tipo}`}>
      <span>{children}</span>
      {onReintentar && (
        <button className="btn btn-sm btn-ghost" onClick={onReintentar}>Reintentar</button>
      )}
    </div>
  );
}

export function Modal({ titulo, onCerrar, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-cab">
          <h3>{titulo}</h3>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Avatar({ nombre, size = 36 }) {
  const ini = (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {ini}
    </span>
  );
}
