const express = require('express');
const Auth = require('../../controllers/middleware');
const ExpenseSchema = require('../../models/Schemas/Expenses');
const calculateUserBalance = require('../../utils/calculateUserBalance');
const GroupSchema = require('../../models/Schemas/Group');
const Home = express.Router();

Home.get('/', Auth, async (req, res) => {
    const userId = req.session.userId;
    const userGroups = await GroupSchema.find({members: userId});
    // console.log(`length of the groups array the current user in is : ${userGroups.length}`);
    for (let group of userGroups) {
        group.expenseArray = await ExpenseSchema.find({group: group._id});
        // console.log('first expense object is :', group.expenseArray[0]);
        // console.log(`the length of the expenses from the group ${group.groupName} is : `, group.expenses.length);
        group.userTotalExpenses = calculateUserBalance(group.expenseArray, userId);
        console.log(`in the group ${group.groupName} here's the current user's Balance : `, group.userTotalExpenses);
    }
    const userDebts = await ExpenseSchema.find({participants: userId, payer: {$ne: userId}});
    if (!req.cookies.has_visited)
    {
        req.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Dashboard', {userGroups});
})

module.exports = Home;