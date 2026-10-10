const express = require(`express`);
const Auth = require(`../../controllers/middleware`);

const Home = express.Router();
const groupsSchema = require(`../../models/Schemas/Group`);
const ExpenseSxhema = require(`../../models/Schemas/Expenses`);

Home.get('/', Auth, (req, res) => {
    const userId = req.session.userId;
    // const groups = groupsSchema.find({ $or: [{owner: userId}, {members: userId}]});
    const userExpenses = ExpenseSchema.find({ $or: [{payer: userId}, {participants: userId}]});
    let i = 0;
    while (i < userExpenses.length())
    {
        
        i++;
    }
    if (!req.cookies.has_visited)
    {
        req.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Dashboard', userExpenses);
    // console.log(req.originalUrl);
})

module.exports = Home;