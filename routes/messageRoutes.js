const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getMessages, envoyerMessage, marquerLu, supprimerConversation } = require('../controllers/messageController');

router.use(authMiddleware);

router.get('/', getMessages);
router.post('/', envoyerMessage);
router.put('/:id/lu', marquerLu);
router.delete('/conversation/:userId', supprimerConversation);

module.exports = router;
