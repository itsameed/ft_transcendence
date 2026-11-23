const UserSchema = require('../models/Schemas/User.js');
const bcrypt = require('bcrypt');
const printLogsDate = require('./printLogs.js');
const { saveAvatar } = require('../config/sharp');
const { resolveDefaultAvatar, pickDefaultAvatar } = require('../config/avatars');
const { MAX_USERNAME_LENGTH } = require('../config/userLimits');
const { createVerificationToken, sendVerificationEmailInBackground } = require('../services/verificationEmail');

async function loadNewUser(req, res, next) {
    let { username, email, password, bio, gender, avatar } = req.body;
    username = (username || '').trim();
    if (!username || !email || !password) {
        return res.status(400).json({message: 'username, email, and password are required.'});
    }
    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (username.length > MAX_USERNAME_LENGTH) {
        return res.status(400).json({ message: 'Username cannot exceed 40 characters.' });
    }

    const existedUser = await UserSchema.findOne({email});
    if (existedUser) {
        return res.status(400).json({message: "Email already registered"});
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verification = createVerificationToken();

        // A chosen default wins; otherwise an uploaded photo; otherwise a
        // deterministic default so no account is ever left without an avatar.
        let avatarPath = resolveDefaultAvatar(avatar);
        if (!avatarPath && req.file) {
            try {
                avatarPath = await saveAvatar(req.file, `signup-${Date.now()}`);
            } catch {
                return res.status(400).json({ message: 'That file is not a readable image.' });
            }
        }
        if (!avatarPath) {
            avatarPath = pickDefaultAvatar(email);
        }

        const newUser = await UserSchema.create({
            username,
            email,
            password: hashedPassword,
            bio,
            gender,
            avatar: avatarPath,
            isVerified: false,
            verificationToken: verification.hash,
            verificationTokenExpires: verification.expires,
        });

        sendVerificationEmailInBackground(newUser, verification.token);

        // No session yet: the account can't sign in until the email is verified.
        printLogsDate(`User with Id ${newUser._id} signed up at : `);
        return res.status(201).json({
            message: 'Account created. Check your email to verify it.',
            email: newUser.email,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This email or username is already registered.' });
        }
        console.error('Error while attempting to create a user:', error);
        return res.status(500).json({ message: 'Unable to create the account. Please try again.' });
    }
}

module.exports = loadNewUser;
