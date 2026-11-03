const UserSchema = require('../models/Schemas/User');

async function getUserSearch(req, res, next) {
    try {
        const slice = (req.query.q || '').trim();
        if (!slice) return res.json([]);
        const searchResults = await UserSchema.find({
            _id: { $ne: req.session.userId },
            username: { $regex: slice, $options: 'i' }
        }).sort({ username: 1 }).limit(10).select("username email");
        return res.json(searchResults);
    } catch (err) {
        return next(err);
    }
}

module.exports = getUserSearch;
