const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getMessages, envoyerMessage, marquerLu } = require('../controllers/messageController');

router.use(authMiddleware);

router.get('/', getMessages);
router.post('/', envoyerMessage);
router.put('/:id/lu', marquerLu);

module.exports = router;
