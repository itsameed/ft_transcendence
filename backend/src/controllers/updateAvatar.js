const User = require('../models/Schemas/User');
const { saveAvatar, removeAvatar } = require('../config/sharp');
const { resolveDefaultAvatar } = require('../config/avatars');

/**
 * Replaces the caller's avatar with an uploaded photo or a chosen default.
 * Accepts multipart (field `avatar`) or JSON ({ avatar: 'aurora' }).
 */
async function updateAvatar(req, res, next) {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).select('avatar');
        if (!user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        let nextAvatar = null;

        if (req.file) {
            try {
                nextAvatar = await saveAvatar(req.file, userId);
            } catch {
                // sharp rejects anything that is not a decodable image.
                return res.status(400).json({ message: 'That file is not a readable image.' });
            }
        } else if (req.body?.avatar) {
            nextAvatar = resolveDefaultAvatar(req.body.avatar);
            if (!nextAvatar) {
                return res.status(400).json({ message: 'Unknown avatar choice.' });
            }
        } else {
            return res.status(400).json({ message: 'Choose an avatar or upload a photo.' });
        }

        const previous = user.avatar;
        user.avatar = nextAvatar;
        await user.save();

        // Only delete a file we wrote, and only after the new one is committed.
        if (previous && previous !== nextAvatar) {
            await removeAvatar(previous);
        }

        return res.json({ avatar: nextAvatar });
    } catch (error) {
        return next(error);
    }
}

module.exports = updateAvatar;
