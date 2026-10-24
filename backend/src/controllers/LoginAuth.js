const UserSchema = require('../models/Schemas/User');
const bcrypt = require('bcrypt');
const printLogsDate = require('../controllers/printLogs');

async function loginAuth(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Your account is suspended' });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        printLogsDate(`User with Id ${user._id} logged in at : `);
        return res.status(200).json({ message: 'Login successful.', userId: user._id, username: user.username, displayName: user.displayName, email: user.email, bio: user.bio, gender: user.gender });
    } catch (error) {
        console.error('Error while attempting to log in:', error);
        return res.status(500).json({ message: 'Unable to log in. Please try again.' });
    }
}

module.exports = loginAuth;