const express = require('express');
const UserSchema = require('../models/Schemas/User');
const printLogsDate = require('../controllers/printLogs');
const { verificationEmailLimiter } = require('../middleware/rateLimiter');
const {
    hashToken,
    createVerificationToken,
    sendVerificationEmailInBackground,
} = require('../services/verificationEmail');

const router = express.Router();

// Same answer whether or not the address has a pending account, so this
// endpoint can't be used to find out who is registered.
const RESEND_RESPONSE = {
    message: 'If that address has an account waiting for verification, a new link is on its way.',
};

function startSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((regenerateError) => {
            if (regenerateError) return reject(regenerateError);
            req.session.userId = String(user._id);
            req.session.username = user.username;
            req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
        });
    });
}

// Called by the frontend /verify-email page with the token from the email link.
router.post('/', async (req, res, next) => {
    const { token } = req.body ?? {};
    if (typeof token !== 'string' || !token) {
        return res.status(400).json({ message: 'Invalid verification link.' });
    }

    try {
        const user = await UserSchema.findOne({
            verificationToken: hashToken(token),
            verificationTokenExpires: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ message: 'This verification link is invalid or has expired.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        // The link proves the user owns the inbox, so it signs them in, except
        // where the normal login checks would stop them anyway.
        if (user.twoFactorEnabled || user.status === 'suspended') {
            return res.json({ verified: true, signedIn: false });
        }

        await startSession(req, user);
        printLogsDate(`User with Id ${user._id} verified their email at : `);
        return res.json({ verified: true, signedIn: true });
    } catch (error) {
        return next(error);
    }
});

router.post('/resend', verificationEmailLimiter, async (req, res, next) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await UserSchema.findOne({ email, isVerified: { $ne: true } });
        if (user) {
            const verification = createVerificationToken();
            user.verificationToken = verification.hash;
            user.verificationTokenExpires = verification.expires;
            await user.save();
            sendVerificationEmailInBackground(user, verification.token);
        }
        return res.json(RESEND_RESPONSE);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
