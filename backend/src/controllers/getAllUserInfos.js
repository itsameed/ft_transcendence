const Group = require('../models/Schemas/Group');


const Expense = require('../models/Schemas/Expenses');
const Settlement = require('../models/Schemas/Settlement');
const User = require('../models/Schemas/User');
const { computeGroupBalances, computePairwiseDebts } = require('../services/balances');

async function getRecentGroupBalances(userId) {
    const groups = await Group.find({ 'members.userId': userId })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('name createdAt members');

    if (groups.length === 0) {
        return [];
    }

    const groupIds = groups.map(group => group._id);

    const [expenses, settlements] = await Promise.all([
        Expense.find({ group: { $in: groupIds } }),
        Settlement.find({ group: { $in: groupIds }, status: 'accepted' }),
    ]);

    const result = groups.map(group => {
        const groupId = group._id.toString();
        const memberIds = group.members.map(member => member.userId);
        const net = computeGroupBalances(
            expenses.filter(e => e.group.toString() === groupId),
            settlements.filter(s => s.group.toString() === groupId),
            memberIds.map(String),
        );

        return {
            groupId: group._id,
            name: group.name,
            createdAt: group.createdAt,
            membersCount: group.members.length,
            memberIds: memberIds,
            balance: net[String(userId)] ?? 0,
        };
    });

    return result;
}

async function getRecentDebts(userId) {
    const me = String(userId);

    const [expenses, settlements] = await Promise.all([
        Expense.find({
            $or: [
                { payer: userId },
                { participants: userId }
            ]
        }).sort({ date: -1 }),
        Settlement.find({
            $or: [{ fromUser: userId }, { toUser: userId }],
            status: 'accepted',
        }),
    ]);

    const { youOwe, oweYou } = computePairwiseDebts(expenses, settlements, me);

    const lastDateFor = (otherId) => {
        let latest = null;
        for (const expense of expenses) {
            const payer = String(expense.payer);
            const involved = payer === me
                ? (expense.participants ?? []).some(p => String(p) === otherId)
                : payer === otherId;
            if (!involved) continue;
            if (!latest || expense.date > latest) latest = expense.date;
        }
        return latest;
    };

    const allIds = [...youOwe.map(d => d.userId), ...oweYou.map(d => d.userId)];
    const users = await User.find({ _id: { $in: allIds } }).select('_id username avatar');
    const userById = new Map(users.map(u => [String(u._id), u]));

    const toFinal = (list) => list
        .map(({ userId: otherId, amount }) => ({
            user: userById.get(otherId) ?? null,
            totalAmount: amount,
            lastExpense: lastDateFor(otherId),
        }))
        .filter(entry => entry.user)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 4);

    const youOweFinal = toFinal(youOwe);
    const oweYouFinal = toFinal(oweYou);

    return {
        totalYouOwe: Math.round(youOweFinal.reduce((sum, e) => sum + e.totalAmount, 0) * 100) / 100,
        youOwe: youOweFinal,
        totalOweYou: Math.round(oweYouFinal.reduce((sum, e) => sum + e.totalAmount, 0) * 100) / 100,
        oweYou: oweYouFinal,
    };
}

async function getUserBalance(req, res, next)
{
    const userId = req.session.userId;
    try {
        const userGroups = await Group.find({ "members.userId": userId }).lean();
        const groupIds = userGroups.map(group => group._id);

        const [expenses, settlements] = await Promise.all([
            Expense.find({ group: { $in: groupIds } }),
            Settlement.find({ group: { $in: groupIds }, status: 'accepted' }),
        ]);

        let totalBalance = 0;
        for (const group of userGroups) {
            const groupId = group._id.toString();
            const net = computeGroupBalances(
                expenses.filter(e => e.group.toString() === groupId),
                settlements.filter(s => s.group.toString() === groupId),
                (group.members ?? []).map(m => String(m.userId)),
            );
            totalBalance += net[String(userId)] ?? 0;
        }

        const userRecentDebts = await getRecentDebts(userId);
        const userRecentGroups = await getRecentGroupBalances(userId);
        return res.json({
            userTotalBalance: { totalBalance: Math.round(totalBalance * 100) / 100 },
            groups: { userRecentGroups },
            debts: { userRecentDebts },
        });
    } catch (error) {
        console.error("Error getting user balance:", error);
        return next(error);
    }
}

module.exports = getUserBalance;