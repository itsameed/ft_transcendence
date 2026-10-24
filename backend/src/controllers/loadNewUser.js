const UserSchema = require('../models/Schemas/User.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const printLogsDate = require('./printLogs.js');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { uniqueNamesGenerator } = require('unique-names-generator');
const { adjectives, colors, animals } = require('../models/DisplayNames/displayNames.js');
// const { ConnectionClosedEvent } = require('mongodb');


async function loadNewUser(req, res, next) {
    console.log(req.body);
    let { fullName, displayName, email, password, bio, phoneNumber, gender } = req.body;
    // console.log();
    if (!fullName || !email || !password) {
        return res.status(400).send('username, email, and password are required.');
    }
    if (!displayName) {
        displayName = uniqueNamesGenerator({
            dictionaries: [adjectives, colors, animals]
        });
    }
    const existedUser = await UserSchema.findOne({email});
    if (existedUser) {
        return res.status(400).json({error: "Email already registered"});
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + (24 * 60 * 60 * 1000);
        const newUser = await UserSchema.create({
            username: fullName,
            displayName,
            email,
            password: hashedPassword,
            bio,
            gender,
            isVerified: false,
            verificationToken,
            verificationTokenExpires,
        });

        // req.session.userId = newUser._id;
        // req.session.username = newUser.username;
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