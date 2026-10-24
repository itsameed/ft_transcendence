const Expense = require('../models/Schemas/Expenses.js');


async function createExpense(req, res, next) {
    const { groupId, amount, description, splitMethod } = req.body;
    if (!groupId || !amount || !splitMethod) {
        return res.status(400).json({ message: 'Invalid expense details.' });
    }
    let participants;
    let customSplit;
    try {
        participants = JSON.parse(req.body.participants || '[]');
        customSplit = JSON.parse(req.body.customSplits || '[]');
    } catch (error) {
        return res.status(400).json({ message: 'Invalid participant data.' });
    }

    if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ message: 'At least one participant is required.' });
    }

    try {
        await Expense.create({
            group: groupId,
            payer: req.session.userId,
            participants,
            amount: Number(amount),
            description,
            splitMethod,
            customSplit,
        });
        printLogsDate(`User with Id ${req.session.userId} created an expense at : `);
        return res.redirect('/dashboard');
    } catch (error) {
        console.error('Error while attempting to save the expense:', error);
        return res.status(500).json({ message: 'Unable to save the expense.' });
    }
}

module.exports = createExpense;