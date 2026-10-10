const express = require('express');
const Expense = express.Router();
const expenseSchema = require(`../../models/Schemas/Expenses`);
const User = require(`../../models/Schemas/User`);
const Group = require(`../../models/Schemas/Group`);
const Auth = require(`../../controllers/middleware`);

Expense.get(`/`, Auth, async (req, res) => {
    const userId = req.session.userId;
    const currentGroup = await expenseSchema.find({group: req.session.groupId}).populate(`amount`);
    // res.send(paidExpenses);
    res.render(`createExpense`);
    // console.log(req.session.userId);
    console.log(currentGroup);
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

module.exports = Expense;