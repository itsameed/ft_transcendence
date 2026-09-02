const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const articleSchema = new Schema({
    username: {
        type: String,
        req: true
    },
    useremail: {
        type: String,
        req: true
    },
    userage: {
        type: Number,
        req: true
    },
});

const roomSchema = new Schema({
    roomname: {
        type: String,
        req: true
    },
    lent: {
        type: Number,
        req: true
    },
});

const userdate = mongoose.model("userdate", articleSchema);
const roomdate = mongoose.model("roomdate", roomSchema);

module.exports = {
    userdate,
    roomdate,
};