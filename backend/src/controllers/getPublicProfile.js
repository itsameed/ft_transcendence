const mongoose = require('mongoose');
const User = require('../models/Schemas/User');
const Group = require('../models/Schemas/Group');
const Friendship = require('../models/Schemas/Friendship');

function formatDay(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

/** Public view of another user: identity + relationship to the caller. No sensitive fields. */
async function getPublicProfile(req, res, next) {
  try {
    const { userId } = req.params;
    const me = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).select('username displayName email joinedAt');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isSelf = userId === me;
    const [groups, friendship] = await Promise.all([
      isSelf
        ? Group.find({ 'members.userId': userId }).select('name kind createdAt')
        : Group.find({ 'members.userId': { $all: [me, userId] } }).select('name kind createdAt'),
      Friendship.findOne({
        $or: [
          { requester: me, receiver: userId },
          { requester: userId, receiver: me },
        ],
      }).select('status requester'),
    ]);

    let relationship = 'none';
    if (isSelf) relationship = 'self';
    else if (friendship?.status === 'ACCEPTED') relationship = 'friends';
    else if (friendship?.status === 'PENDING') {
      relationship = String(friendship.requester) === me ? 'request-sent' : 'request-received';
    }

    return res.json({
      user: {
        id: user._id,
        name: user.displayName || user.username,
        username: user.username,
        email: user.email,
        joinedAt: formatDay(user.joinedAt),
        isSelf,
        relationship,
        friendshipId: friendship ? String(friendship._id) : null,
      },
      groups: groups.map((g) => ({ id: g._id, name: g.name, kind: g.kind, createdAt: g.createdAt })),
      groupsLabel: isSelf ? 'Your groups' : 'Groups you share',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = getPublicProfile;
