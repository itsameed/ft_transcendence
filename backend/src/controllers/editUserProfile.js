const UserSchema = require('../models/Schemas/User');
const { MAX_USERNAME_LENGTH } = require('../config/userLimits');

async function editUserProfile(req, res, next)
{
    const {username, email} = req.body;
    const trimmedUsername = typeof username === 'string' ? username.trim() : '';
    if (!trimmedUsername || trimmedUsername.length > MAX_USERNAME_LENGTH) {
        return res.status(400).json({ message: 'Username must be between 1 and 40 characters.' });
    }

    const updatedUser = await UserSchema.findByIdAndUpdate(
        req.session.userId, 
        { username: trimmedUsername, email},
        {new: true}
    );
    res.json(updatedUser);
}

module.exports = editUserProfile;