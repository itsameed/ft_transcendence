const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    bio: String,
    phoneNumber: String,
    gender: String,
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