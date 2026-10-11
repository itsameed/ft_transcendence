import express from 'express';
import Auth from '../../controllers/middleware.js';
import ExpenseSchema from '../../models/Schemas/Expenses.js';
import calculate_user_expenses from '../../utils/calculateUserBalance.js';
import GroupSchema from '../../models/Schemas/Group.js';
const Home = express.Router();

Home.get('/', Auth, async (req, res) => {
    const userId = req.session.userId;
    // console.log(userId);
    const userExpenses = await ExpenseSchema.find({payer: userId});
    const userGroups = await GroupSchema.find({members: userId});
    console.log('groups the current user is in  are : ', userGroups);
    // console.log(JSON.stringify(userExpenses, null, 2));
    for (let group of userGroups) {
        group.expenses = await ExpenseSchema.find({group: group._id});
        console.log('current group expenses are : ', group.expenses);
        group.userTotalExpenses = calculate_user_expenses(group.expenses, req.session.userId);
        console.log("Calculated total:", group.userTotalExpenses);
    }
    const userExpensesInt = calculate_user_expenses(userExpenses);
    console.log("user total expenses are : ",userExpensesInt);
    const userDebts = await ExpenseSchema.find({participants: userId, payer: {$ne: userId}});
    const combined = [...userExpenses, ...userDebts];
    if (!req.cookies.has_visited)
    {
        req.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Dashboard', {combined, userGroups});
    // console.log(req.originalUrl);
})

export default Home;