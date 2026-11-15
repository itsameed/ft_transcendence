const Settlement = require('../models/Schemas/Settlement.js');

/** Settlements for one group, or every settlement the caller is part of. */
async function getSettlements(req, res, next) {
    try {
        const userId = req.session.userId;
        const { groupId } = req.query;

        const filter = {
            $or: [{ fromUser: userId }, { toUser: userId }],
        };
        if (groupId) filter.group = groupId;

        const settlements = await Settlement.find(filter)
            .populate('fromUser', 'username avatar')
            .populate('toUser', 'username avatar')
            .sort({ date: -1 });

        return res.status(200).json({ settlements });
    } catch (error) {
        return next(error);
    }
}

module.exports = getSettlements;
