const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    displayName: {
        type: String,
        trim: true,
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
        required: true
    },
    bio: String,
    gender: String,
    googleId: String,
    avatar: String,
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
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