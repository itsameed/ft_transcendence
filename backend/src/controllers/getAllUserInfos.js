const roundNearest = (num) => Math.round(num);
const Group = require('../models/Schemas/Group');


const Expense = require('../models/Schemas/Expenses');
const User = require('../models/Schemas/User');

async function getRecentGroupBalances(userId) {
    
    const groups = await Group.find({ 'members.userId': userId })
        .sort({ createdAt: -1 }) 
        .limit(4)
        .select('name createdAt members');

    if (groups.length === 0) {
        return []; 
    }

    
    const groupIds = groups.map(group => group._id);

    
    const expenses = await Expense.find({ group: { $in: groupIds } });

    
    const balances = {};
    groups.forEach(group => {
        balances[group._id.toString()] = 0;
    });

    
    for (let i = 0; i < expenses.length; i++) {
        const exp = expenses[i];
        const groupId = exp.group.toString();
        
        const isPayer = exp.payer.toString() === userId.toString();
        const isParticipant = exp.participants.some(
            p => p.toString() === userId.toString()
        );

        
        if (isPayer || isParticipant) {
            const userShare = getUserShare(exp, userId);
            const amountUserPaid = isPayer ? exp.amount : 0;

            
            balances[groupId] += (amountUserPaid - userShare);
        }
    }

    
    const result = groups.map(group => {
        const groupId = group._id.toString();
        const rawBalance = balances[groupId];
        
        return {
            groupId: group._id,
            name: group.name,
            createdAt: group.createdAt.toISOString().replace('T', ' ').slice(0, 19),
            membersCount: group.members.length,
            
            balance: Math.round(rawBalance * 100) / 100 
        };
    });

    return result;
}
// helper function for getting a specific user's share in a custom split
function getUserShare(expense, targetUserId) {
    
    if (expense.splitMethod === 'custom') {
        const splitEntry = expense.customSplit.find(
            s => s.user.toString() === targetUserId.toString()
        );
        return splitEntry ? splitEntry.amount : 0;
    }

    
    const participantCount = expense.participants.length;
    if (participantCount === 0) return 0;
    
    return expense.amount / participantCount;
}

async function getRecentDebts(userId) {
    const expenses = await Expense.find({
        $or: [
            { payer: userId },
            { participants: userId }
        ]
    }).sort({ date: -1 });

    let youOweList = [];
    let oweYouList = [];

    for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        const iAmPayer = expense.payer.toString() === userId.toString();

        if (iAmPayer) {
            for (let j = 0; j < expense.participants.length; j++) {
                const participantId = expense.participants[j].toString();
                if (participantId === userId.toString()) continue;
                const share = getShare(expense, participantId);
                if (share <= 0) continue;

                let found = false;
                for (let k = 0; k < oweYouList.length; k++) {
                    if (oweYouList[k].debtorId === participantId) {
                        oweYouList[k].amount += share;
                        if (expense.date > oweYouList[k].lastDate) {
                            oweYouList[k].lastDate = expense.date;
                        }
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    oweYouList.push({
                        debtorId: participantId,
                        amount: share,
                        lastDate: expense.date
                    });
                }
            }
        } else {
            const payerId = expense.payer.toString();
            const share = getShare(expense, userId);
            if (share <= 0) continue;

            let found = false;
            for (let k = 0; k < youOweList.length; k++) {
                if (youOweList[k].payerId === payerId) {
                    youOweList[k].amount += share;
                    if (expense.date > youOweList[k].lastDate) {
                        youOweList[k].lastDate = expense.date;
                    }
                    found = true;
                    break;
                }
            }

            if (!found) {
                youOweList.push({
                    payerId: payerId,
                    amount: share,
                    lastDate: expense.date
                });
            }
        }
    }

    youOweList.sort((a, b) => b.lastDate - a.lastDate);
    oweYouList.sort((a, b) => b.lastDate - a.lastDate);

    youOweList = youOweList.slice(0, 4);
    oweYouList = oweYouList.slice(0, 4);

    const allIds = [];
    for (let i = 0; i < youOweList.length; i++) {
        allIds.push(youOweList[i].payerId);
    }
    for (let i = 0; i < oweYouList.length; i++) {
        allIds.push(oweYouList[i].debtorId);
    }

    const users = await User.find({ _id: { $in: allIds } })
        .select('_id username avatar');

    let totalYouOweSum = 0;
    const youOweFinal = [];
    
    for (let i = 0; i < youOweList.length; i++) {
        const item = youOweList[i];
        const user = users.find(u => u._id.toString() === item.payerId);
        
        totalYouOweSum += item.amount;
        
        youOweFinal.push({
            user: user,
            totalAmount: Math.round(item.amount * 100) / 100,
            lastExpense: item.lastDate
        });
    }

    let totalOweYouSum = 0;
    const oweYouFinal = [];
    
    for (let i = 0; i < oweYouList.length; i++) {
        const item = oweYouList[i];
        const user = users.find(u => u._id.toString() === item.debtorId);
        
        totalOweYouSum += item.amount;
        
        oweYouFinal.push({
            user: user,
            totalAmount: Math.round(item.amount * 100) / 100,
            lastExpense: item.lastDate
        });
    }

    return {
        totalYouOwe: Math.round(totalYouOweSum * 100) / 100,
        youOwe: youOweFinal,
        totalOweYou: Math.round(totalOweYouSum * 100) / 100,
        oweYou: oweYouFinal
    };
}

//helper function to get a specific user's share in a custom split or equal split
function getShare(expense, targetUserId) {
    if (expense.splitMethod === 'custom') {
        for (let i = 0; i < expense.customSplit.length; i++) {
            if (expense.customSplit[i].user.toString() === targetUserId.toString()) {
                return expense.customSplit[i].amount;
            }
        }
        return 0;
    }

    if (expense.participants.length === 0) return 0;
    return expense.amount / expense.participants.length;
}

function calculateUserBalance(ExpenseArray, userId, group) {
    try {
    let userOwes = 0;
    let OwedToUser = 0;
    
    ExpenseArray.forEach(expense => {
        if (String(expense.payer) === String(userId)) {
            if(expense.splitMethod === 'equal') {
                if (expense.participants && expense.participants.length > 0)
                    OwedToUser += (expense.amount - (expense.amount / expense.participants.length));
            }
            else if (expense.splitMethod === 'custom') {
                for ( let j = 0; j < expense.customSplit.length; j++) {
                    if (String(expense.customSplit[j].user) !== String(userId))
                        OwedToUser += expense.customSplit[j].amount;
                }
            }
        }
        else {
            
            if(expense.splitMethod === 'equal') {
                if (expense.participants && expense.participants.length > 0)
                    userOwes += (expense.amount / expense.participants.length);
            }
            else if (expense.splitMethod === 'custom') {
                for ( let j = 0; j < expense.customSplit.length; j++) {
                    if (String(expense.customSplit[j].user) === String(userId))
                        userOwes += expense.customSplit[j].amount;
                }
            }
        }
    });
    return {
        groupName: group.name,
        groupMembersCount: group.members.length,
        userOwes: roundNearest(userOwes),
        OwedToUser: roundNearest(OwedToUser),
        NetBalance: roundNearest(OwedToUser - userOwes),
    };
    } catch (error) {
        console.error("Error calculating user balance:", error);
        throw error;
    }
}


async function getUserBalance(req, res, next)
{
    const userId = req.session.userId;
    try {
    const formattedGroups = [];
    
    const userGroups = await Group.find({ "members.userId": userId }).lean();
    
    for (let group of userGroups) {
        console.log("current group is : ", group.name);
        const expenses = await Expense.find({group: group._id});
        const balance = calculateUserBalance(expenses, userId, group);
        group.expenses = expenses;
        group.userTotalBalance = balance;
        formattedGroups.push(group.userTotalBalance);
        
    }
    const userRecentDebts = await getRecentDebts(userId);
    const userRecentGroups = await getRecentGroupBalances(userId);
    return res.json({groups: {userRecentGroups}, debts: {userRecentDebts},});
    } catch (error) {
        console.error("Error getting user balance:", error);
        throw error;
    }
}

module.exports = getUserBalance;