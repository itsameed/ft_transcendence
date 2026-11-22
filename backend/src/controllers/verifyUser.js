const express = require('express');
const router = express.Router();
const UserSchema = require('../models/Schemas/User');

// Handle the link click from the email
router.get('/', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ message: 'Invalid verification link' });
        }

        // Find user with this token that hasn't expired
        const user = await UserSchema.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification link' });
        }

        // Mark as verified and clear the token
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        // Redirect to your React frontend login page with a success flag
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8443';
        res.redirect(`${frontendUrl}/login?verified=true`);

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});

module.exports = router;