const mongoose = require('mongoose');
const Settlement = require('../models/Schemas/Settlement.js');
const Group = require('../models/Schemas/Group.js');
const printLogsDate = require('./printLogs.js');

/**
 * Records a payment from the caller to another member of the same group.
 * The expense that created the debt stays; the settlement offsets it.
 */
async function addSettlement(req, res, next) {
    const { groupId, toUserId, amount } = req.body;
    const settlementAmount = Number(amount);

    if (!groupId || !toUserId || !Number.isFinite(settlementAmount) || settlementAmount <= 0) {
        return res.status(400).json({ message: 'Settlement data is invalid.' });
    }
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(toUserId)) {
        return res.status(400).json({ message: 'Settlement data is invalid.' });
    }

    const fromUserId = String(req.session.userId);
    if (String(toUserId) === fromUserId) {
        return res.status(400).json({ message: 'You cannot settle with yourself.' });
    }

    try {
        const group = await Group.findById(groupId).select('members');
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        const memberIds = (group.members ?? []).map((m) => String(m.userId?._id ?? m.userId));
        if (!memberIds.includes(fromUserId) || !memberIds.includes(String(toUserId))) {
            return res.status(403).json({ message: 'Both people must be members of this group.' });
        }

        const settlement = await Settlement.create({
            group: groupId,
            fromUser: fromUserId,
            toUser: toUserId,
            amount: Math.round(settlementAmount * 100) / 100,
            // Self-reported payments are final; there is no approval step.
            status: 'accepted',
        });

        printLogsDate(`User with Id ${fromUserId} settled ${settlementAmount} with ${toUserId} at : `);
        return res.status(201).json({
            message: 'Settlement recorded.',
            settlement: {
                id: settlement._id,
                groupId: settlement.group,
                fromUser: settlement.fromUser,
                toUser: settlement.toUser,
                amount: settlement.amount,
                date: settlement.date,
            },
        });
    } catch (error) {
        console.error('Error while saving the settlement:', error);
        return next(error);
    }
}

module.exports = addSettlement;
