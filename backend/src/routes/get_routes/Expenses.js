const express = require('express');
const Expense = require('../../models/Schemas/Expenses.js');
const requireAuth = require('../../controllers/middleware.js');
const printLogsDate = require('../../utils/printLogs.js');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    printLogsDate(`User with Id ${userId} viewed Expenses list at : `);
    const groupExpenses = await Expense.find({group: req.session.groupId}).populate(`amount`);
    // res.send(paidExpenses);
    res.render(`createExpense`);
    // console.log(req.session.userId);
    console.log(groupExpenses);
    // let i = 0;
    // let paidamount = 0;
    // while (i < paidExpenses.length)
    // {
    //     paidamount += paidExpenses[i].amount;
    //     i++;
    // }
    // console.log(paidamount);
    // res.send("got the expenses right!");
    // const involvedExpenses = await expenseSchema.find({participants: userId}).populate(`payer`);

});

module.exports = router;