const router = require('express').Router();
const c = require('../controllers/moderacionController');
const { auth, soloRoles } = require('../middlewares/auth');

// Cualquier usuario con sesión puede reportar
router.post('/apuntes/:id/reportar', auth, c.reportar);

// Moderación (moderador o admin)
const mod = [auth, soloRoles('admin', 'moderador')];
router.get('/admin/estadisticas', ...mod, c.estadisticas);
router.get('/admin/reportes', ...mod, c.listarReportes);
router.put('/admin/reportes/:id', ...mod, c.resolverReporte);
router.get('/admin/apuntes', ...mod, c.listarApuntesAdmin);
router.put('/admin/apuntes/:id/estado', ...mod, c.cambiarEstadoApunte);

// Solo admin
const admin = [auth, soloRoles('admin')];
router.get('/admin/usuarios', ...admin, c.listarUsuarios);
router.put('/admin/usuarios/:id', ...admin, c.actualizarUsuario);
router.post('/admin/programas', ...admin, c.crearPrograma);
router.post('/admin/materias', ...admin, c.crearMateria);

module.exports = router;
