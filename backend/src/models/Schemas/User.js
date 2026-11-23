const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        }
    },
    bio: String,
    gender: String,
    googleId: String,
    avatar: String,
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
    // Two-factor auth (TOTP). Secrets are AES-GCM encrypted and, like the
    // recovery-code hashes, never loaded unless a query asks for them with
    // .select('+field'), so they can't leak through whole-document responses.
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorPendingSecret: { type: String, select: false },
    twoFactorLastStep: { type: Number, select: false },
    twoFactorRecoveryCodes: { type: [String], select: false, default: undefined },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ["active", "suspended"],
        default: "active"
    },
}));

module.exports = User;