const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { getAnnonces, creerAnnonce, supprimerAnnonce } = require('../controllers/annonceController');

router.use(authMiddleware);

router.get('/', getAnnonces);
router.post('/', creerAnnonce);
router.delete('/:id', supprimerAnnonce);

module.exports = router;
