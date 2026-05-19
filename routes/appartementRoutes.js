const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getTousAppartements,
  creerAppartement,
  modifierAppartement,
  supprimerAppartement,
} = require('../controllers/appartementController');

router.use(authMiddleware);

router.get('/', getTousAppartements);
router.post('/', creerAppartement);
router.put('/:id', modifierAppartement);
router.delete('/:id', supprimerAppartement);

module.exports = router;
