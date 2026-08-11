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

const userdate = mongoose.model("userdate", articleSchema);

module.exports = userdate;