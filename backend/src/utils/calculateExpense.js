const User = require(`../models/Schemas/User`);


function calculate_all_payments(Expense) {
    if(Expense.splitMethod == 'equal')
        return (Expense.amount - (Expense.amount / Expense.participants.length));
    else if (Expense.splitMethod == 'custom')
    {
        let i = 0;
        let share = 0;
        while (i < Expense.customSplit.length)
        {
            share += Expense.customSplit[i].amount;
            i++;
        }
        return share;
    }
}