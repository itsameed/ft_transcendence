const express = require('express');
const router = express.Router();
const passport = require('../middleware/googleAuth');

router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.userId = req.user._id;
        res.redirect('/');
    }
);

module.exports = router;