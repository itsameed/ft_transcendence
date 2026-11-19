const UserSchema = require('../models/Schemas/User');


async function editUserProfile(req, res, next)
{
    const {username, email} = req.body;

    const updatedUser = await UserSchema.findByIdAndUpdate(
        req.session.userId, 
        { username, email},
        {new: true}
    );
    res.json(updatedUser);
}

module.exports = editUserProfile;