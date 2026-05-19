const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getPaiements,
  creerPaiement,
  modifierPaiement,
  supprimerPaiement,
} = require('../controllers/paiementController');

router.use(authMiddleware);

router.get('/', getPaiements);
router.post('/', creerPaiement);
router.put('/:id', modifierPaiement);
router.delete('/:id', supprimerPaiement);

module.exports = router;
