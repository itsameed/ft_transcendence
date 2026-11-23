const express = require('express');
const apiAuth = require('../middleware/apiAuth');
const { twoFactorLimiter } = require('../middleware/rateLimiter');
const controller = require('../controllers/twoFactorController');

const router = express.Router();

router.get('/', apiAuth, controller.status);
router.post('/setup', apiAuth, controller.setup);
router.post('/enable', apiAuth, twoFactorLimiter, controller.enable);
router.post('/disable', apiAuth, twoFactorLimiter, controller.disable);
router.post('/recovery-codes', apiAuth, twoFactorLimiter, controller.regenerateRecoveryCodes);

module.exports = router;
