const mongoose = require('mongoose');
const Group = require('../models/Schemas/Group');
const Expense = require('../models/Schemas/Expenses');
const Settlement = require('../models/Schemas/Settlement');
const User = require('../models/Schemas/User');
const { computeGroupBalances, computePairwiseDebts } = require('../services/balances');

/**
 * GET /api/groups/:groupId/balances
 * Per-member net plus the caller's pairwise debts, after settlements.
 */
async function getGroupBalances(req, res, next) {
    try {
        const { groupId } = req.params;
        const currentUserId = String(req.user.id);

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID' });
        }

        const group = await Group.findById(groupId).select('members');
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const memberIds = (group.members ?? []).map((m) => String(m.userId?._id ?? m.userId));
        if (!memberIds.includes(currentUserId)) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        const [expenses, settlements, users] = await Promise.all([
            Expense.find({ group: groupId }),
            Settlement.find({ group: groupId, status: 'accepted' }),
            User.find({ _id: { $in: memberIds } }).select('_id username avatar'),
        ]);

        const net = computeGroupBalances(expenses, settlements, memberIds);
        const { youOwe, oweYou } = computePairwiseDebts(expenses, settlements, currentUserId);
        const userById = new Map(users.map((u) => [String(u._id), u]));

        const withUser = (entry) => {
            const user = userById.get(entry.userId);
            return user
                ? { user: { id: String(user._id), name: user.username, avatar: user.avatar ?? null }, amount: entry.amount }
                : null;
        };

        return res.json({
            myBalance: net[currentUserId] ?? 0,
            totalSpent: Math.round(expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0) * 100) / 100,
            members: memberIds
                .map((id) => {
                    const user = userById.get(id);
                    return user
                        ? { user: { id, name: user.username, avatar: user.avatar ?? null }, net: net[id] ?? 0 }
                        : null;
                })
                .filter(Boolean),
            youOwe: youOwe.map(withUser).filter(Boolean),
            oweYou: oweYou.map(withUser).filter(Boolean),
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = getGroupBalances;
