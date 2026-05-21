const express = require('express');
const router = express.Router();
const { register, login, supprimerUser } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authMiddleware, register);
router.post('/login', login);
router.delete('/users/:id', authMiddleware, supprimerUser);

module.exports = router;
