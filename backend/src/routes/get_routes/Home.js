const express = require('express');
const Auth = require('../../controllers/middleware');
const getUserBalance = require('../../utils/calculateUserBalance');
const Home = express.Router();

Home.get('/', Auth, async (req, res) => {
    const userId = req.session.userId;
    const formattedGroups = await getUserBalance(userId);
    console.dir(formattedGroups, {depth: null, colors: true});
    if (!req.cookies.has_visited)
    {
        req.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Dashboard', {formattedGroups});
})

module.exports = Home;