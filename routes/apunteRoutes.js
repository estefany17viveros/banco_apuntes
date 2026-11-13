const router = require('express').Router();
const c = require('../controllers/apunteController');
const { auth, authOpcional } = require('../middlewares/auth');
const { upload, MAX_ARCHIVOS } = require('../middlewares/upload');

const subir = upload.array('archivos', MAX_ARCHIVOS);

// Catálogo (público)
router.get('/programas', c.programas);
router.get('/materias', c.materias);
router.get('/metodologias', c.metodologias);

// Apuntes
router.get('/apuntes', authOpcional, c.listar);
router.get('/apuntes/mios', auth, c.mios); // antes de /:id
router.get('/apuntes/:id', authOpcional, c.obtener);
router.post('/apuntes', auth, subir, c.crear);
router.put('/apuntes/:id', auth, subir, c.actualizar);
router.delete('/apuntes/:id', auth, c.eliminar);

module.exports = router;
