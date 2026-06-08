const express = require('express');
const router = express.Router();
const { authMiddleware, isGestionnaire } = require('../middlewares/authMiddleware');
const { getMesResidences, creerResidence, modifierResidence, supprimerResidence } = require('../controllers/residencesController');
const { getBatiments, creerBatiment, supprimerBatiment } = require('../controllers/batimentsController');
const { getAppartements, creerAppartement, assignerResident } = require('../controllers/appartementsController');

router.use(authMiddleware, isGestionnaire);

// Résidences
router.get('/residences',      getMesResidences);
router.post('/residences',     creerResidence);
router.put('/residences/:id',  modifierResidence);
router.delete('/residences/:id', supprimerResidence);

// Bâtiments
router.get('/residences/:residenceId/batiments',    getBatiments);
router.post('/residences/:residenceId/batiments',   creerBatiment);
router.delete('/batiments/:id',                     supprimerBatiment);

// Appartements
router.get('/residences/:residenceId/appartements',  getAppartements);
router.post('/residences/:residenceId/appartements', creerAppartement);
router.put('/appartements/:id',                      assignerResident);

module.exports = router;
