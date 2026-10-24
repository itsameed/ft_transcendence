const UserSchema = require('../models/Schemas/User');
const bcrypt = require('bcrypt');
const printLogsDate = require('../controllers/printLogs');

async function loginAuth(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    try {
        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid credentials. Please try again.');
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).send('Invalid credentials. Please try again.');
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Your account is suspended' });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        printLogsDate(`User with Id ${user._id} logged in at : `);
        return res.redirect('/dashboard');
    } catch (error) {
        console.error('Error while attempting to log in:', error);
        return res.status(500).send('Unable to log in. Please try again.');
    }
}

module.exports = loginAuth;