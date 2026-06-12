const express = require('express');
const router = express.Router();
const { verifierQR, scanLogin } = require('../controllers/scanController');

router.post('/scan/login',    scanLogin);
router.post('/scan/verifier', verifierQR);

module.exports = router;
