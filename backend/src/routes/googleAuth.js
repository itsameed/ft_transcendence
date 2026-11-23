const express = require('express');
const router = express.Router();
const passport = require('../middleware/googleAuth');
const { startChallenge } = require('../controllers/loginTwoFactor');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5175';

router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=google` }),
    async (req, res, next) => {
        try {
            // Google proves who you are, not that you hold your authenticator.
            if (req.user.twoFactorEnabled) {
                await startChallenge(req, req.user, 'google');
                return res.redirect(`${FRONTEND_URL}/login?step=2fa`);
            }
            req.session.userId = req.user._id;
            return res.redirect(`${FRONTEND_URL}/dashboard`);
        } catch (error) {
            return next(error);
        }
    }
);

module.exports = router;
