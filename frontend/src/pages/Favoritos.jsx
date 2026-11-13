import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mensajeError } from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import ApunteCard from '../componentes/ApunteCard';
import { Aviso, Spinner, Vacio } from '../componentes/Ui';

export default function Favoritos() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { data } = await api.get('/favoritos');
      setItems(data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const quitar = async (apunte) => {
    try {
      await api.post(`/apuntes/${apunte._id}/favorito`); // alterna: ya era favorito → lo quita
      setItems((l) => l.filter((a) => a._id !== apunte._id));
      toast.ok('Quitado de favoritos');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <>
      <div className="pagina-cab">
        <div>
          <h1>♥ Mis favoritos</h1>
          <p className="muted">Los apuntes que guardaste para estudiar después.</p>
        </div>
        <span className="pill pill-orange">{items.length} guardados</span>
      </div>

      {error && <Aviso onReintentar={cargar}>{error}</Aviso>}
      {cargando ? (
        <Spinner />
      ) : items.length === 0 && !error ? (
        <Vacio icono="💔" titulo="Aún no tienes favoritos" texto="Toca el corazón de un apunte para guardarlo aquí.">
          <Link to="/" className="btn btn-primary">Explorar apuntes</Link>
        </Vacio>
      ) : (
        <div className="grid-apuntes">
          {items.map((a) => <ApunteCard key={a._id} apunte={a} onFavorito={quitar} />)}
        </div>
      )}
    </>
  );
}
