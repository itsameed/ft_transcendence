const express = require('express');
const router = express.Router();
const passport = require('../middleware/googleAuth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5175';

router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=google` }),
    (req, res) => {
        req.session.userId = req.user._id;
        res.redirect(`${FRONTEND_URL}/dashboard`);
    }
);

module.exports = router;
