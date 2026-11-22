const crypto = require('crypto');
<<<<<<< Updated upstream
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
        return res.status(400).json({message: 'username, email, and password are required.'});
=======
const {saveAvatar} = require('../config/sharp.js');
const bcrypt = require('bcrypt');
const UserSchema = require('../models/Schemas/User'); // Adjust path
const transporter = require('../config/mailer');      // Import the mailer
const {resolveDefaultAvatar, pickDefaultAvatar} = require('../config/avatars');

async function loadNewUser(req, res, next) {
    let { username, email, password, bio, gender, avatar } = req.body;
    username = (username || '').trim();
    
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'username, email, and password are required.' });
>>>>>>> Stashed changes
    }
    if (!displayName) {
        displayName = uniqueNamesGenerator({
            dictionaries: [adjectives, colors, animals]
        });
    }
<<<<<<< Updated upstream
    const existedUser = await UserSchema.findOne({email});
=======
    if (username.length > 40) {
        return res.status(400).json({ message: 'Username cannot exceed 40 characters.' });
    }

    const existedUser = await UserSchema.findOne({ email });
>>>>>>> Stashed changes
    if (existedUser) {
        return res.status(400).json({ message: "Email already registered" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
<<<<<<< Updated upstream
        const verificationTokenExpires = Date.now() + (24 * 60 * 60 * 1000);
=======
        const verificationTokenExpires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        let avatarPath = resolveDefaultAvatar(avatar);
        if (!avatarPath && req.file) {
            try {
                avatarPath = await saveAvatar(req.file, `signup-${Date.now()}`);
            } catch(error) {
                console.error("avatar saving failed", error);
                return res.status(400).json({ message: 'That file is not a readable image.' });
            }
        }
        if (!avatarPath) {
            avatarPath = pickDefaultAvatar(email);
        }

        // 1. Create the user in the database
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        // req.session.userId = newUser._id;
        // req.session.username = newUser.username;
        printLogsDate(`User with Id ${newUser._id} signed up at : `);
        return res.status(201).json({ message: 'User created successfully.', userId: newUser._id ,username: newUser.username, displayName: newUser.displayName, email: newUser.email, bio: newUser.bio, gender: newUser.gender});
=======
        // 2. SEND THE VERIFICATION EMAIL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${frontendUrl}/verify?token=${verificationToken}`;

        try {
            await transporter.sendMail({
                from: `"Splitify" <${process.env.GMAIL_USER}>`,
                to: newUser.email,
                subject: 'Verify Your Email Address',
                html: `
                    <h2>Welcome, ${newUser.username}!</h2>
                    <p>Please verify your email address by clicking the link below:</p>
                    <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>This link will expire in 24 hours.</p>
                `
            });
            console.log(`✅ Verification email sent to ${newUser.email}`);
        } catch (emailError) {
            console.error('❌ Failed to send verification email:', emailError);
            // We don't return an error here, because the user was still created successfully.
        }

        // 3. Log the user in (regenerate session)
        req.session.regenerate((sessionError) => {
            if (sessionError) return next(sessionError);

            req.session.userId = String(newUser._id);
            req.session.username = newUser.username;
            
            req.session.save((saveError) => {
                if (saveError) return next(saveError);

                console.log(`User with Id ${newUser._id} signed up at: ${new Date().toISOString()}`);
                
                return res.status(201).json({
                    message: 'User created successfully. Please check your email to verify your account.',
                    userId: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    avatar: newUser.avatar,
                });
            });
        });

>>>>>>> Stashed changes
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This email or username is already registered.' });
        }
        console.error('Error while attempting to create a user:', error);
        return res.status(500).json({ message: 'Unable to create the account. Please try again.' });
    }
}

module.exports = loadNewUser;