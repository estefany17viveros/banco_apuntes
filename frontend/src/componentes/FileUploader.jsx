import { useRef, useState } from 'react';
import { ICONO_TIPO, fmtTam, tipoArchivo } from '../utils';

const MAX_MB = 25;
const MAX_ARCHIVOS = 10;
const EXT_OK = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'zip', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'wav', 'ogg', 'm4a', 'mp4', 'webm', 'mov'];

/**
 * Selector de archivos desde el computador (arrastrar y soltar o clic).
 * Los archivos se guardan en el estado del padre (arreglo de File) y se envían con FormData.
 */
export default function FileUploader({ archivos, onChange, cupo = MAX_ARCHIVOS, onError }) {
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);

  const agregar = (lista) => {
    const nuevos = [];
    const rechazados = [];
    for (const f of Array.from(lista)) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (!EXT_OK.includes(ext)) rechazados.push(`${f.name}: tipo no permitido`);
      else if (f.size > MAX_MB * 1024 * 1024) rechazados.push(`${f.name}: supera ${MAX_MB} MB`);
      else if (archivos.some((x) => x.name === f.name && x.size === f.size)) continue;
      else nuevos.push(f);
    }
    const permitidos = nuevos.slice(0, Math.max(cupo - archivos.length, 0));
    if (nuevos.length > permitidos.length) rechazados.push(`Máximo ${MAX_ARCHIVOS} archivos por apunte`);
    if (rechazados.length && onError) onError(rechazados.join(' · '));
    if (permitidos.length) onChange([...archivos, ...permitidos]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        className={`dropzone ${arrastrando ? 'activa' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); agregar(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <div className="dropzone-icono">⬆️</div>
        <strong>Arrastra tus archivos aquí o haz clic para elegirlos</strong>
        <small>PDF, Word, PowerPoint, Excel, imágenes, audio y video · hasta {MAX_MB} MB cada uno · máx. {MAX_ARCHIVOS}</small>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={EXT_OK.map((e) => `.${e}`).join(',')}
          onChange={(e) => agregar(e.target.files)}
        />
      </div>

      {archivos.length > 0 && (
        <ul className="lista-archivos">
          {archivos.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <span className="archivo-ico">{ICONO_TIPO[tipoArchivo(f.type, f.name)]}</span>
              <span className="archivo-nombre">{f.name}</span>
              <small>{fmtTam(f.size)}</small>
              <button type="button" className="icon-btn" onClick={() => onChange(archivos.filter((_, j) => j !== i))} aria-label={`Quitar ${f.name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
