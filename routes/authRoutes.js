const express = require('express');
const router = express.Router();
const { register, login, supprimerUser, getGestionnaire } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authMiddleware, register);
router.post('/login', login);
router.get('/gestionnaire', getGestionnaire);
router.delete('/users/:id', authMiddleware, supprimerUser);

module.exports = router;
