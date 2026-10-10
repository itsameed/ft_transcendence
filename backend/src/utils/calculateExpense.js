function calculate_user_expenses(Expense) {
    let totalExpenses = 0;
    for (let i = 0; i < Expense.length; i++)
    {
        const item = Expense[i];
        if(item.splitMethod === 'equal')
        {
            if (item.participants && item.participants.length > 0)
                totalExpenses += (item.amount - (item.amount / item.participants.length));
        }
        else if (item.splitMethod === 'custom')
        {
            for ( let j = 0; i < item.customSplit.length; j++)
            {
                if (String(item.customSplit[j].user) !== String(item.payer))
                    totalExpenses += item.customSplit[i].amount;
            }
        }
    }
    return totalExpenses;
}

export default calculate_user_expenses;