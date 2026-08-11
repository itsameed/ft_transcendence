const mongoose = require("mongoose");
const Schema = mongoose.Schema;
 
const articleSchema = new Schema({
  username: String,
});

const userdate = mongoose.model("userdate", articleSchema);
 
module.exports = userdate;