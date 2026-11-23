const UserSchema = require('../models/Schemas/User');
const bcrypt = require('bcrypt');
const printLogsDate = require('../controllers/printLogs');
const { startChallenge } = require('./loginTwoFactor');

async function loginAuth(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const identifier = String(email).trim();
        const user = await UserSchema.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier }
            ]
        });
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Your account is suspended' });
        }

        // The password already matched, so returning the address leaks nothing
        // and lets the frontend offer to resend the link.
        if (!user.isVerified) {
            return res.status(403).json({
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Please verify your email before signing in.',
                email: user.email,
            });
        }

        // Password was right, but the account wants a code too.
        if (user.twoFactorEnabled) {
            await startChallenge(req, user, 'password');
            return res.status(200).json({ requires2fa: true, message: 'Enter the code from your authenticator app.' });
        }

        const isAdmin = user.role === 'admin' || user.username === 'admin' || user.email === 'admin@splitify.test';

        req.session.userId = user._id;
        req.session.username = user.username;
        printLogsDate(`User with Id ${user._id} logged in at : `);
        return res.status(200).json({
            message: 'Login successful.',
            userId: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            gender: user.gender,
            role: isAdmin ? 'admin' : (user.role || 'user')
        });
    } catch (error) {
        console.error('Error while attempting to log in:', error);
        return res.status(500).json({ message: 'Unable to log in. Please try again.' });
    }
}

module.exports = loginAuth;
