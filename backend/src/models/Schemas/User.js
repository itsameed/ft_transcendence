import mongoose from 'mongoose';

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    email: {type: String, unique: true},
    password: String,
    // _id: String
}));

export default User;