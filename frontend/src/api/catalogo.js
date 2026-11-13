import { useEffect, useState } from 'react';
import api from './axiosInstance';

// Programas y metodologías (se cargan una vez)
export function useCatalogo() {
  const [programas, setProgramas] = useState([]);
  const [metodologias, setMetodologias] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    Promise.all([api.get('/programas'), api.get('/metodologias')])
      .then(([p, m]) => {
        if (!vivo) return;
        setProgramas(p.data);
        setMetodologias(m.data);
      })
      .catch(() => vivo && setError(true));
    return () => { vivo = false; };
  }, []);

  return { programas, metodologias, error };
}

// Materias del programa elegido
export function useMaterias(programaId) {
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    let vivo = true;
    if (!programaId) { setMaterias([]); return; }
    api.get('/materias', { params: { programa_id: programaId } })
      .then((r) => vivo && setMaterias(r.data))
      .catch(() => vivo && setMaterias([]));
    return () => { vivo = false; };
  }, [programaId]);

  return materias;
}
