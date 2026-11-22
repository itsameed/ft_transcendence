const crypto = require('crypto');
const Group = require('../../models/Schemas/Group');
const Expense = require('../../models/Schemas/Expenses');
const Settlement = require('../../models/Schemas/Settlement');
const User = require('../../models/Schemas/User');

function makeDoc(id, text) 
{
    return {
        id: String(id),
        text: text,
        hash: crypto.createHash('sha256').update(text).digest('hex')
    };
}

function fmtDate(d) 
{
    if (!d) 
        return 'Unknown';

    try 
    {
        const date = new Date(d);

        if (isNaN(date.getTime())) 
            return String(d);

        return date.toISOString().slice(0, 10);
    } 
    catch (e) 
    {
        return String(d);
    }
}

function calculateBalances(expenses, settlements, members) 
{
    const balances = {};

    (members || []).forEach(function (m) 
    {
        const name = m && m.userId && m.userId.username;

        if (name) 
            balances[name] = 0;
    });

    (expenses || []).forEach(function (exp) 
    {
        const payer = exp.payer && exp.payer.username;
        const amount = exp.amount;

        if (!payer || typeof amount !== 'number') 
            return;

        if (balances[payer] !== undefined) 
            balances[payer] += amount;

        const customSplit = exp.customSplit;

        if (
            exp.splitMethod === 'custom' &&
            Array.isArray(customSplit) &&
            customSplit.length > 0
        ) 
        {
            customSplit.forEach(function (split) 
            {
                const username = split && split.user && split.user.username;

                if (username && balances[username] !== undefined) 
                    balances[username] -= split.amount;
            });
        } 
        else 
        {
            const participants = (exp.participants || [])
                .map(function (p) 
                {
                    return p && p.username;
                })
                .filter(Boolean);

            if (participants.length > 0) 
            {
                const share = amount / participants.length;

                participants.forEach(function (p) 
                {
                    if (balances[p] !== undefined) 
                        balances[p] -= share;
                });
            }
        }
    });

    (settlements || []).forEach(function (s) 
    {
        const from = s.fromUser && s.fromUser.username;
        const to = s.toUser && s.toUser.username;
        const amount = s.amount;

        if (from && balances[from] !== undefined) 
            balances[from] += amount;

        if (to && balances[to] !== undefined) 
            balances[to] -= amount;
    });

    return balances;
}

async function loadGroupDocuments(userId, groupId) 
{
    try 
    {
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

        if (!group) 
            return null;

        const user = await User.findById(userId).select('username').lean();

        if (!user) 
            return null;

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

        const membersList = group.members || [];
        let members = '';

        for (let i = 0; i < membersList.length; i++) 
        {
            const name = membersList[i] &&
                membersList[i].userId &&
                membersList[i].userId.username;

            if (name) 
            {
                if (members !== '') 
                    members += ', ';

                members += name;
            }
        }

        const ownerName = group.createdBy && group.createdBy.username
            ? group.createdBy.username
            : 'Unknown';

        docs.push(makeDoc(
            'group:' + groupId,
            `Group: ${group.name}. Description: ${group.description || 'None'}. Owner: ${ownerName}. Members: ${members}.`
        ));

        const balances = calculateBalances(expenses, settlements, membersList);

        let balanceText = "Current Balances Summary:\n";

        for (const [name, amount] of Object.entries(balances)) 
        {
            const rounded = Math.round(amount * 100) / 100;

            if (rounded > 0) 
                balanceText += `${name} is owed ${rounded} MAD. `;
            else if (rounded < 0) 
                balanceText += `${name} owes ${Math.abs(rounded)} MAD. `;
            else 
                balanceText += `${name} is settled (owes 0). `;
        }

        docs.push(makeDoc('balances:summary', balanceText));

        let totalSpent = 0;
        let expenseSummaryText = "Expenses Summary:\n";

        (expenses || []).forEach(function (exp) 
        {
            totalSpent += exp.amount || 0;

            const payerName = exp.payer && exp.payer.username
                ? exp.payer.username
                : 'Unknown';

            expenseSummaryText += `- ${exp.description}: ${exp.amount} MAD (Paid by ${payerName}).\n`;
        });

        totalSpent = Math.round(totalSpent * 100) / 100;

        expenseSummaryText += `Total group spending: ${totalSpent} MAD.`;

        docs.push(makeDoc('expenses:summary', expenseSummaryText));

        for (let i = 0; i < (expenses || []).length; i++) 
        {
            const expense = expenses[i];
            let participants = '';

            const parts = expense.participants || [];

            for (let j = 0; j < parts.length; j++) 
            {
                const name = parts[j] && parts[j].username;

                if (name) 
                {
                    if (participants !== '') 
                        participants += ', ';

                    participants += name;
                }
            }

            const payerName = expense.payer && expense.payer.username
                ? expense.payer.username
                : 'Unknown';

            let text = `Expense: ${expense.description}. Amount: ${expense.amount} MAD. Paid by: ${payerName}. Date: ${fmtDate(expense.date)}. Split method: ${expense.splitMethod}. Participants: ${participants || 'Not specified'}.`;

            if (
                expense.splitMethod === 'custom' &&
                Array.isArray(expense.customSplit)
            ) 
            {
                let shares = '';

                for (let j = 0; j < expense.customSplit.length; j++) 
                {
                    const split = expense.customSplit[j];
                    const uname = split && split.user && split.user.username
                        ? split.user.username
                        : 'Unknown';

                    if (shares !== '') 
                        shares += ', ';

                    shares += `${uname}: ${split.amount} MAD`;
                }

                text += ` Custom shares: ${shares}.`;
            }

            docs.push(makeDoc('expense:' + expense._id, text));
        }

        for (let i = 0; i < (settlements || []).length; i++) 
        {
            const s = settlements[i];

            const fromName = s.fromUser && s.fromUser.username
                ? s.fromUser.username
                : 'Unknown';

            const toName = s.toUser && s.toUser.username
                ? s.toUser.username
                : 'Unknown';

            docs.push(makeDoc(
                'settlement:' + s._id,
                `Settlement: ${fromName} paid ${toName} ${s.amount} MAD. Status: ${s.status}. Date: ${fmtDate(s.date)}.`
            ));
        }

        return { docs: docs, groupName: group.name };
    } 
    catch (err) 
    {
        console.error('[dataSource] Error:', err.message);
        return null;
    }
}

async function getGroupName(groupId) 
{
    try 
    {
        const group = await Group.findById(groupId).select('name').lean();

        if (group && group.name) 
            return group.name;

        return 'group';
    } 
    catch (err) 
    {
        return 'group';
    }
}

module.exports = {
    loadGroupDocuments,
    getGroupName
};