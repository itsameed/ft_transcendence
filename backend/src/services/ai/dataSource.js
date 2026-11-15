const Group = require('../../models/Schemas/Group');
const Expense = require('../../models/Schemas/Expenses');
const Settlement = require('../../models/Schemas/Settlement');
const User = require('../../models/Schemas/User');

async function loadGroupDocuments(userId, groupId) {
    try {
        const group = await Group.findOne({
            _id: groupId,
            $or: [
                { createdBy: userId },
                { 'members.userId': userId }
            ]
        })
            .populate('members.userId', 'username')
            .populate('createdBy', 'username')
            .lean();

        if (!group) {
            return null;
        }

        const user = await User.findById(userId).select('username').lean();

        if (!user) {
            return null;
        }

        const expenses = await Expense.find({ group: groupId })
            .sort({ date: -1 })
            .limit(200)
            .populate('payer', 'username')
            .populate('participants', 'username')
            .populate('customSplit.user', 'username')
            .lean();

        const settlements = await Settlement.find({ group: groupId })
            .sort({ date: -1 })
            .limit(200)
            .populate('fromUser', 'username')
            .populate('toUser', 'username')
            .lean();

        const docs = [];

        docs.push(`Current User: ${user.username}`);

        let members = '';
        for (let i = 0; i < group.members.length; i++) {
            const name = group.members[i].userId.username;
            if (members !== '') {
                members += ', ';
            }
            members += name;
        }

        docs.push(
            `Group: ${group.name}. ` +
            `Description: ${group.description || 'None'}. ` +
            `Owner: ${group.createdBy.username}. ` +
            `Members: ${members}.`
        );

        for (let i = 0; i < expenses.length; i++) {
            const expense = expenses[i];
            let participants = '';

            for (let j = 0; j < expense.participants.length; j++) {
                if (participants !== '') {
                    participants += ', ';
                }
                participants += expense.participants[j].username;
            }

            let text =
                `Expense: ${expense.description}. ` +
                `Amount: ${expense.amount} MAD. ` +
                `Paid by: ${expense.payer.username}. ` +
                `Date: ${expense.date}. ` +
                `Split method: ${expense.splitMethod}. ` +
                `Participants: ${participants || 'Not specified'}.`;

            if (expense.splitMethod === 'custom') {
                let shares = '';
                for (let j = 0; j < expense.customSplit.length; j++) {
                    const split = expense.customSplit[j];
                    if (shares !== '') {
                        shares += ', ';
                    }
                    shares += `${split.user.username}: ${split.amount} MAD`;
                }
                text += ` Custom shares: ${shares}.`;
            }

            docs.push(text);
        }

        for (let i = 0; i < settlements.length; i++) {
            const settlement = settlements[i];
            docs.push(
                `Settlement: ${settlement.fromUser.username} ` +
                `paid ${settlement.toUser.username} ` +
                `${settlement.amount} MAD. ` +
                `Status: ${settlement.status}. ` +
                `Date: ${settlement.date}.`
            );
        }

        return {
            docs,
            groupName: group.name
        };

    } catch (err) {
        console.error('[dataSource] Error:', err.message);
        return null;
    }
}

module.exports = { loadGroupDocuments };
