import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './componentes/Layout';
import RutaProtegida from './componentes/RutaProtegida';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Home from './pages/Home';
import CrearEditarApunte from './pages/CrearEditarApunte';
import ApunteDetalle from './pages/ApunteDetalle';
import Favoritos from './pages/Favoritos';
import Perfil from './pages/Perfil';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Home />} />
        <Route path="crear" element={<CrearEditarApunte />} />
        <Route path="apuntes/:id" element={<ApunteDetalle />} />
        <Route path="apuntes/:id/editar" element={<CrearEditarApunte />} />
        <Route path="favoritos" element={<Favoritos />} />
        <Route path="perfil" element={<Perfil />} />
        <Route
          path="admin"
          element={<RutaProtegida roles={['admin', 'moderador']}><AdminDashboard /></RutaProtegida>}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
