const router = require('express').Router();
const c = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

router.post('/registro', c.registrar);
router.post('/login', c.login);
router.get('/me', auth, c.me);
router.put('/me', auth, c.actualizarPerfil);

module.exports = router;
