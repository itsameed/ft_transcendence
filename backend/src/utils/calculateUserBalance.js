const roundNearest = (num) => Math.round(num);
const ExpenseSchema = require('../models/Schemas/Expenses');
const GroupSchema = require('../models/Schemas/Group');

function calculateUserBalance(ExpenseArray, userId, groupName) {
    let userOwes = 0;
    let OwedToUser = 0;
    // console.log(userId);
    // console.log(`length of the coming expenses array is : ${ExpenseArray.length}`);
    // console.log(`current user id is: ${userId}`);
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
            // console.log('reached');
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
        groupName: groupName,
        userOwes: roundNearest(userOwes),
        OwedToUser: roundNearest(OwedToUser),
        NetBalance: roundNearest(OwedToUser - userOwes),
    };
}


async function getUserBalance(userId)
{
    const formattedGroups = [];
    const userGroups = await GroupSchema.find({members: userId}).lean();
    for (let group of userGroups) {
        const expenses = await ExpenseSchema.find({group: group._id});
        const balance = calculateUserBalance(expenses, userId, group.groupName);
        group.expenses = expenses;
        group.userTotalBalance = balance;
        formattedGroups.push(group.userTotalBalance);
        // console.log(`in the group ${group.groupName} here's the current user's Balance : `, balance);
    }
    return formattedGroups;
}

module.exports = getUserBalance;