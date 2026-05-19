const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getTousResidents,
  getResident,
  modifierResident,
  supprimerResident,
  getProfilResident,
} = require('../controllers/residentController');

router.use(authMiddleware);

// /profil doit être avant /:id pour ne pas être capturé comme un id
router.get('/profil', getProfilResident);

router.get('/', getTousResidents);
router.get('/:id', getResident);
router.put('/:id', modifierResident);
router.delete('/:id', supprimerResident);

module.exports = router;
