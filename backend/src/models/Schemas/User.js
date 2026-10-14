const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    email: {type: String, unique: true},
    password: String,
    bio: String,
    phoneNumber: String,
    gender: String,
    joinedAt: {
        type: Date,
        default: Date.now,
    }
    // _id: String
}));

module.exports = User;