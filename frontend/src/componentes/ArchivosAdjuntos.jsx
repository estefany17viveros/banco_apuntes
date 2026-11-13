import { useState } from 'react';
import { ICONO_TIPO, fmtTam, tipoArchivo, urlArchivo } from '../utils';

// Lista de archivos de un apunte con vista previa (imagen, PDF, audio, video) y descarga.
export default function ArchivosAdjuntos({ archivos }) {
  const [abierto, setAbierto] = useState(null);
  if (!archivos?.length) return null;

  return (
    <div className="adjuntos">
      {archivos.map((f) => {
        const tipo = tipoArchivo(f.mimetype, f.nombre);
        const url = urlArchivo(f.url);
        const previsualizable = ['imagen', 'pdf', 'audio', 'video'].includes(tipo);
        const visible = abierto === f._id;
        return (
          <div key={f._id} className="adjunto">
            <div className="adjunto-cab">
              <span className="archivo-ico">{ICONO_TIPO[tipo]}</span>
              <div className="adjunto-info">
                <strong>{f.nombre}</strong>
                <small>{tipo.toUpperCase()} · {fmtTam(f.tamano)}</small>
              </div>
              {previsualizable && (
                <button className="btn btn-sm btn-ghost" onClick={() => setAbierto(visible ? null : f._id)}>
                  {visible ? 'Ocultar' : 'Ver'}
                </button>
              )}
              <a className="btn btn-sm btn-primary" href={url} target="_blank" rel="noreferrer" download={f.nombre}>
                Descargar
              </a>
            </div>
            {visible && (
              <div className="adjunto-vista">
                {tipo === 'imagen' && <img src={url} alt={f.nombre} />}
                {tipo === 'pdf' && <iframe src={url} title={f.nombre} />}
                {tipo === 'audio' && <audio src={url} controls />}
                {tipo === 'video' && <video src={url} controls />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
