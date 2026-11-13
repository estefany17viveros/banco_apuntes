const router = require('express').Router();
const c = require('../controllers/interaccionController');
const { auth } = require('../middlewares/auth');

router.post('/apuntes/:id/calificar', auth, c.calificar);

router.post('/apuntes/:id/favorito', auth, c.alternarFavorito);
router.get('/favoritos', auth, c.misFavoritos);

router.get('/apuntes/:id/comentarios', c.listarComentarios);
router.post('/apuntes/:id/comentarios', auth, c.comentar);
router.delete('/comentarios/:id', auth, c.eliminarComentario);

router.get('/notificaciones', auth, c.notificaciones);
router.put('/notificaciones/leer-todas', auth, c.leerTodas);

module.exports = router;
