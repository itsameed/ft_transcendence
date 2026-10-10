import express from 'express';
import Auth from '../../controllers/middleware.js';
import ExpenseSchema from '../../models/Schemas/Expenses.js';
import calculate_user_expenses from '../../utils/calculateExpense.js';
const Home = express.Router();

Home.get('/', Auth, async (req, res) => {
    const userId = req.session.userId;
    console.log(userId);
    const userExpenses = await ExpenseSchema.find({payer: userId});
    console.log(JSON.stringify(userExpenses, null, 2));
    const userDebtsInt = calculate_user_expenses(userExpenses);
    console.log(userDebtsInt);
    const userDebts = await ExpenseSchema.find({participants: userId, payer: {$ne: userId}});
    const combined = [...userExpenses, ...userDebts];
    if (!req.cookies.has_visited)
    {
        req.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Dashboard', combined);
    // console.log(req.originalUrl);
})

export default Home;