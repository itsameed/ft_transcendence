const express = require('express');
const router = express.Router();
const UserSchema = require('../models/Schemas/User');

// router.get('/', async (req, res) => {
//     try {
//         const { token } = req.query;
        
//         if (!token) {
//             return res.status(400).json({ message: 'Invalid verification link' });
//         }

//         const user = await UserSchema.findOne({
//             verificationToken: token,
//             verificationTokenExpires: { $gt: Date.now() }
//         });

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid or expired verification link' });
//         }

//         user.isVerified = true;
//         user.verificationToken = undefined;
//         user.verificationTokenExpires = undefined;
//         await user.save();

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         res.redirect(`${frontendUrl}/login?verified=true`);
//         // here it's up to the front end to redirect or not

//     } catch (error) {
//         console.error('Verification error:', error);
//         res.status(500).json({ message: 'Server error during verification' });
//     }
// });

router.get('/', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ message: 'Invalid verification link' });
        }

        const user = await UserSchema.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification link' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        req.session.regenerate((sessionError) => {
            if (sessionError) {
                console.error('Session regeneration error:', sessionError);
                return res.status(500).json({ message: 'Failed to create session' });
            }

            req.session.userId = String(user._id);
            req.session.username = user.username;
            
            req.session.save((saveError) => {
                if (saveError) {
                    console.error('Session save error:', saveError);
                    return res.status(500).json({ message: 'Failed to save session' });
                }

                console.log(`User ${user._id} verified and logged in`);
                
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
                res.redirect(`${frontendUrl}/dashboard`);
                // here it's up to the front end to weather redirect or not
            });
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});

module.exports = router;