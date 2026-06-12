const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { creerVisiteur, getMesVisiteurs, annulerVisiteur } = require('../controllers/visiteursController');

router.post('/visiteurs',              authMiddleware, creerVisiteur);
router.get('/visiteurs',               authMiddleware, getMesVisiteurs);
router.put('/visiteurs/:id/annuler',   authMiddleware, annulerVisiteur);

module.exports = router;
