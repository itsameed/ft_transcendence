const UserSchema = require('../models/Schemas/User');
const Friendship = require('../models/Schemas/Friendship');

async function getUserSearch(req, res, next) {
    try {
        const slice = (req.query.q || '').trim();
        if (!slice) return res.json([]);
        const currentUserId = String(req.user.id);
        const searchResults = await UserSchema.find({
            _id: { $ne: currentUserId },
            username: { $regex: slice, $options: 'i' }
        }).sort({ username: 1 }).limit(10).select("username email avatar");
        const resultIds = searchResults.map((user) => user._id);
        const friendships = resultIds.length
            ? await Friendship.find({
                $or: [
                    { requester: currentUserId, receiver: { $in: resultIds } },
                    { receiver: currentUserId, requester: { $in: resultIds } },
                ],
            }).select('requester receiver status')
            : [];
        const relationshipByUserId = new Map();

        for (const friendship of friendships) {
            const requesterId = String(friendship.requester);
            const otherUserId = requesterId === currentUserId
                ? String(friendship.receiver)
                : requesterId;
            let relationship = 'none';

            if (friendship.status === 'ACCEPTED') {
                relationship = 'friends';
            } else if (friendship.status === 'PENDING') {
                relationship = requesterId === currentUserId ? 'request-sent' : 'request-received';
            }

            relationshipByUserId.set(otherUserId, relationship);
        }

        return res.json(searchResults.map((user) => ({
            ...user.toObject(),
            relationship: relationshipByUserId.get(String(user._id)) ?? 'none',
        })));
    } catch (err) {
        return next(err);
    }
}

module.exports = getUserSearch;
