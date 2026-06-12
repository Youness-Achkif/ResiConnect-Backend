const express = require('express');
const router = express.Router();
const { authMiddleware, isGestionnaire } = require('../middlewares/authMiddleware');
const { getHistorique } = require('../controllers/historiqueController');

router.get('/historique-acces', authMiddleware, isGestionnaire, getHistorique);

module.exports = router;
