const UserSchema = require('../models/Schemas/User.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const printLogsDate = require('./printLogs.js');
const { saveAvatar } = require('../config/sharp');
const { resolveDefaultAvatar, pickDefaultAvatar } = require('../config/avatars');
const { MAX_USERNAME_LENGTH } = require('../config/userLimits');

async function loadNewUser(req, res, next) {
    let { username, email, password, bio, gender, avatar } = req.body;
    username = (username || '').trim();
    if (!username || !email || !password) {
        return res.status(400).json({message: 'username, email, and password are required.'});
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
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + (24 * 60 * 60 * 1000);

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
            verificationToken,
            verificationTokenExpires,
        });

        req.session.regenerate((sessionError) => {
            if (sessionError) return next(sessionError);

            req.session.userId = String(newUser._id);
            req.session.username = newUser.username;
            req.session.save((saveError) => {
                if (saveError) return next(saveError);

                printLogsDate(`User with Id ${newUser._id} signed up at : `);
                return res.status(201).json({
                    message: 'User created successfully.',
                    userId: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    bio: newUser.bio,
                    gender: newUser.gender,
                    avatar: newUser.avatar,
                });
            });
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
