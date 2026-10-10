const express = require(`express`);
const ExpenseRouter = express.Router();
const ExpenseSchema = require(`../../models/Schemas/Expenses`);

ExpenseRouter.post(`/`, async (req, res) => {
    const {groupId, payer, participants, amount, splitMethod} = req.body;

    if (!groupId || !payer || !amount || !splitMethod)
        return res.status(400).send("Invalid Expense credentials.");
    if (!Array.isArray(participants) || participants.length === 0)
        res.status(400).send("there must be participants in your expense.");
    const newExpense = new ExpenseSchema ({
        group: req.body.groupId,
        payer: req.session.userId,
        participants: participants,
        amount: amount,
        splitMethod: splitMethod,
    });
    try {
        await newExpense.save();
        res.redirect(`Dashboard`);
    } catch (error) {
        console.error(`Error while attempting to save the Expense.`);
        res.status(500).send("Error while attempting to save the expense");
    }
});

module.exports = ExpenseRouter;