const crypto = require('crypto');
const Group = require('../../models/Schemas/Group');
const Expense = require('../../models/Schemas/Expenses');
const Settlement = require('../../models/Schemas/Settlement');
const User = require('../../models/Schemas/User');

function makeDoc(id, text) {
    return {
        id: String(id),
        text: text,
        hash: crypto.createHash('sha256').update(text).digest('hex')
    };
}

function calculateBalances(expenses, settlements, members) {
    const balances = {};
    
    members.forEach(m => {
        if (m && m.userId && m.userId.username) {
            balances[m.userId.username] = 0;
        }
    });

    expenses.forEach(exp => {
        const payer = exp.payer?.username;
        const amount = exp.amount;
        
        if (!payer) return;

        if (balances[payer] !== undefined) {
            balances[payer] += amount;
        }

        if (exp.splitMethod === 'custom' && exp.customSplit && exp.customSplit.length > 0) {
            exp.customSplit.forEach(split => {
                const username = split.user?.username;
                if (username && balances[username] !== undefined) {
                    balances[username] -= split.amount;
                }
            });
        } else {
            const participants = exp.participants.map(p => p.username).filter(Boolean);
            if (participants.length > 0) {
                const share = amount / participants.length;
                participants.forEach(p => {
                    if (balances[p] !== undefined) {
                        balances[p] -= share;
                    }
                });
            }
        }
    });

    settlements.forEach(s => {
        const from = s.fromUser?.username;
        const to = s.toUser?.username;
        const amount = s.amount;
        
        if (from && balances[from] !== undefined) {
            balances[from] += amount;
        }
        if (to && balances[to] !== undefined) {
            balances[to] -= amount;
        }
    });

    return balances;
}

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

        if (!group) return null;

        const user = await User.findById(userId).select('username').lean();
        if (!user) return null;

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

        docs.push(makeDoc('user:' + userId, `Current User: ${user.username}`));

        let members = '';
        for (let i = 0; i < group.members.length; i++) {
            const name = group.members[i].userId?.username;
            if (name) {
                if (members !== '') members += ', ';
                members += name;
            }
        }

        docs.push(makeDoc(
            'group:' + groupId,
            `Group: ${group.name}. Description: ${group.description || 'None'}. Owner: ${group.createdBy?.username || 'Unknown'}. Members: ${members}.`
        ));

        const balances = calculateBalances(expenses, settlements, group.members);
        let balanceText = "Current Balances Summary:\n";
        for (const [name, amount] of Object.entries(balances)) {
            const rounded = Math.round(amount * 100) / 100;
            if (rounded > 0) balanceText += `${name} is owed ${rounded} MAD. `;
            else if (rounded < 0) balanceText += `${name} owes ${Math.abs(rounded)} MAD. `;
            else balanceText += `${name} is settled (owes 0). `;
        }
        docs.push(makeDoc('balances:summary', balanceText));

        let totalSpent = 0;
        let expenseSummaryText = "Expenses Summary:\n";
        expenses.forEach(exp => {
            totalSpent += exp.amount;
            expenseSummaryText += `- ${exp.description}: ${exp.amount} MAD (Paid by ${exp.payer?.username || 'Unknown'}).\n`;
        });
        expenseSummaryText += `Total group spending: ${totalSpent} MAD.`;
        docs.push(makeDoc('expenses:summary', expenseSummaryText));

        for (let i = 0; i < expenses.length; i++) {
            const expense = expenses[i];
            let participants = '';
            for (let j = 0; j < expense.participants.length; j++) {
                const name = expense.participants[j]?.username;
                if (name) {
                    if (participants !== '') participants += ', ';
                    participants += name;
                }
            }

            let text = `Expense: ${expense.description}. Amount: ${expense.amount} MAD. Paid by: ${expense.payer?.username || 'Unknown'}. Date: ${expense.date}. Split method: ${expense.splitMethod}. Participants: ${participants || 'Not specified'}.`;

            if (expense.splitMethod === 'custom') {
                let shares = '';
                for (let j = 0; j < expense.customSplit.length; j++) {
                    const split = expense.customSplit[j];
                    if (shares !== '') shares += ', ';
                    shares += `${split.user?.username || 'Unknown'}: ${split.amount} MAD`;
                }
                text += ` Custom shares: ${shares}.`;
            }
            docs.push(makeDoc('expense:' + expense._id, text));
        }

        for (let i = 0; i < settlements.length; i++) {
            const s = settlements[i];
            docs.push(makeDoc(
                'settlement:' + s._id,
                `Settlement: ${s.fromUser?.username || 'Unknown'} paid ${s.toUser?.username || 'Unknown'} ${s.amount} MAD. Status: ${s.status}. Date: ${s.date}.`
            ));
        }

        return { docs: docs, groupName: group.name };

    } catch (err) {
        console.error('[dataSource] Error:', err.message);
        return null;
    }
}

async function getGroupName(groupId) {
    try {
        const group = await Group.findById(groupId).select('name').lean();
        return group ? group.name : 'group';
    } catch (err) 
    {
        return 'group';
    }
}

module.exports = {
    loadGroupDocuments,
    getGroupName
};