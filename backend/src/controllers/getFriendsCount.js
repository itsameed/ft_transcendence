const FriendshipSchema  = require('../models/Schemas/Friendship');


async function getFriendsCount(userId) {
    const count = await FriendshipSchema.countDocuments({
        $or: [
            { requester: userId, status: "ACCEPTED" },
            { receiver: userId, status: "ACCEPTED" }
        ]
    });
    
    return count;
}

module.exports = getFriendsCount;