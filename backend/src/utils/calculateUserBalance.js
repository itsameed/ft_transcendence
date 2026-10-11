const roundNearest = (num) => Math.round(num);

function calculateUserBalance(ExpenseArray, userId) {
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
        userOwes: roundNearest(userOwes),
        OwedToUser: roundNearest(OwedToUser),
        NetBalance: roundNearest(OwedToUser - userOwes),
    };
}

module.exports = calculateUserBalance;