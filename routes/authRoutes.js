const express = require('express');
const router = express.Router();
const {
  register,
  login,
  supprimerUser,
  getGestionnaireByResidence,
  inviterResident,
  activateToken,
  setPassword,
  getMe,
  registerResident,
} = require('../controllers/authController');
const { authMiddleware, isGestionnaire, checkResidenceOwner } = require('../middlewares/authMiddleware');

// AUTH-1 : public
router.post('/register', register);
router.post('/register-resident', registerResident);

router.post('/login', login);

// AUTH-4 : invitation résident (gestionnaire authentifié + propriétaire de la résidence)
router.post('/invite-resident', authMiddleware, isGestionnaire, checkResidenceOwner, inviterResident);

// AUTH-5 : vérification token (publique)
router.get('/activate/:token', activateToken);

// AUTH-6 : définition du mot de passe (publique)
router.post('/set-password', setPassword);

// AUTH-7 : gestionnaire par résidence (publique)
router.get('/gestionnaire/:residenceId', getGestionnaireByResidence);

router.get('/me', authMiddleware, getMe);

// existant
router.delete('/users/:id', authMiddleware, supprimerUser);

module.exports = router;
