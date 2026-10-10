const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },

    useremail: {
        type: String,
        required: true
    },

    userage: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("User", userSchema);