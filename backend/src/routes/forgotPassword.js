const express = require('express');
const Auth = require('../middleware/requireAuth');
const cookieAuth = require('../middleware/cookieAuth');
const router = express.Router();

router.post('/change-password', cookieAuth, async (req, res) => {
    const { newPassword } = req.body;
    const user = await User.findById(req.session.userId);
    
    // CASE 1: Google user who hasn't verified email yet
    if (user.googleId && !user.isVerified) {
        return res.status(403).json({ 
            error: 'Please verify your email before changing password' 
        });
    }
    
    // CASE 2: Email/password user who hasn't verified
    if (!user.googleId && !user.isVerified) {
        return res.status(403).json({ 
            error: 'Please verify your email first' 
        });
    }
    
    // CASE 3: User is verified → allow password change
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
});

router.post('/send-verification', Auth, async (req, res) => {
    const user = await User.findById(req.session.userId);
    
    // Generate token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();
    
    // Send email
    const verificationLink = `http://localhost:3000/auth/verify-password-change?token=${verificationToken}`;
    
    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Verify Email for Password Change',
        html: `<p>Click to verify: <a href="${verificationLink}">${verificationLink}</a></p>`
    });
    
    res.json({ message: 'Verification email sent' });
});

module.exports = router;