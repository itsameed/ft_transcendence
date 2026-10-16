const UserSchema = require('../models/Schemas/User');
const bcrypt = require('bcrypt');
const printLogsDate = require('../utils/printLogs.js');
const { uniqueNamesGenerator } = require('unique-names-generator');
const { adjectives, colors, animals } = require('../models/DisplayNames/displayNames.js');


async function loadNewUser(req, res, next) {
    const { username, displayName, email, password, bio, phoneNumber, gender } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send('username, email, and password are required.');
    }
    if (!displayName) {
        displayName = uniqueNamesGenerator({
            dictionaries: [adjectives, colors, animals]
        });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username: fullName,
            displayName,
            email,
            password: hashedPassword,
            bio,
            phoneNumber,
            gender,
        });

        req.session.userId = newUser._id;
        req.session.username = newUser.username;
        printLogsDate(`User with Id ${newUser._id} signed up at : `);
        return res.redirect('/dashboard');
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).send('This email or username is already registered.');
        }

        console.error('Error while attempting to create a user:', error);
        return res.status(500).send('Unable to create the account. Please try again.');
    }
}

module.exports = loadNewUser;