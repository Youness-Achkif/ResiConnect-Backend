const express = require('express');
const router = express.Router();
const { authMiddleware, isGestionnaire } = require('../middlewares/authMiddleware');
const { envoyerDemande, getDemandesEnAttente, accepterDemande, refuserDemande } = require('../controllers/joinRequestsController');

router.post('/join-requests',                authMiddleware, envoyerDemande);
router.get('/join-requests',                 authMiddleware, isGestionnaire, getDemandesEnAttente);
router.put('/join-requests/:id/accept',      authMiddleware, isGestionnaire, accepterDemande);
router.put('/join-requests/:id/reject',      authMiddleware, isGestionnaire, refuserDemande);

module.exports = router;
