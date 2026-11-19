const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Schemas/User');
const { pickDefaultAvatar } = require('../config/avatars');

// console.log("here is the client id : ", process.env.GOOGLE_CLIENT_ID);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (user) {
            // Link the Google identity to the existing password account.
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        }
        
        let baseUsername = email.split('@')[0].replace(/[^A-Za-z0-9_.]/g, '_');
        let username = baseUsername;
        let suffix = 1;
        while (await User.exists({ username })) {
            username = `${baseUsername}_${suffix++}`;
        }

        user = new User({
            username,
            email,
            password: null, // No password for Google users
            googleId: profile.id,
            isVerified: profile.emails[0].verified, // Google already verified it!
            avatar: profile.photos[0]?.value || pickDefaultAvatar(profile.emails[0].value)
        });
        
        await user.save();
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

module.exports = passport;