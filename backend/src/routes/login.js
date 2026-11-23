const express = require('express');
const loginAuth = require('../controllers/LoginAuth');
const router = express.Router();
const { loginLimiter, twoFactorLimiter } = require('../middleware/rateLimiter.js');
const { verifyLoginCode, cancelChallenge, challengeStatus } = require('../controllers/loginTwoFactor');

router.get('/', (req, res) => {
   res.status(200).json({ message: 'Login page rendered successfully.' });
});

router.post('/', loginLimiter, loginAuth);
router.get('/2fa', challengeStatus);
router.post('/2fa', twoFactorLimiter, verifyLoginCode);
router.post('/2fa/cancel', cancelChallenge);

module.exports = router;
