const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  getProblemes,
  signalerProbleme,
  modifierProbleme,
  supprimerProbleme,
} = require('../controllers/problemeController');

router.use(authMiddleware);

router.get('/', getProblemes);
router.post('/', signalerProbleme);
router.put('/:id', modifierProbleme);
router.delete('/:id', supprimerProbleme);

module.exports = router;
