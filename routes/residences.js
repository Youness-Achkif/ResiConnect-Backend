const express = require('express');
const router = express.Router();
const { authMiddleware, isGestionnaire } = require('../middlewares/authMiddleware');
const { getMesResidences, creerResidence, modifierResidence, supprimerResidence } = require('../controllers/residencesController');
const { getBatiments, creerBatiment, supprimerBatiment } = require('../controllers/batimentsController');
const { getAppartements, creerAppartement, assignerResident, supprimerAppartement } = require('../controllers/appartementsController');

// Résidences
router.get('/residences',        authMiddleware, isGestionnaire, getMesResidences);
router.post('/residences',       authMiddleware, isGestionnaire, creerResidence);
router.put('/residences/:id',    authMiddleware, isGestionnaire, modifierResidence);
router.delete('/residences/:id', authMiddleware, isGestionnaire, supprimerResidence);

// Bâtiments
router.get('/residences/:residenceId/batiments',    authMiddleware, isGestionnaire, getBatiments);
router.post('/residences/:residenceId/batiments',   authMiddleware, isGestionnaire, creerBatiment);
router.delete('/batiments/:id',                     authMiddleware, isGestionnaire, supprimerBatiment);

// Appartements
router.get('/residences/:residenceId/appartements',  authMiddleware, isGestionnaire, getAppartements);
router.post('/residences/:residenceId/appartements', authMiddleware, isGestionnaire, creerAppartement);
router.put('/appartements/:id',                      authMiddleware, isGestionnaire, assignerResident);
router.delete('/appartements/:id',                   authMiddleware, isGestionnaire, supprimerAppartement);

module.exports = router;
