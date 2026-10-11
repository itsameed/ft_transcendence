const express = require('express');
const Auth = require('../../controllers/middleware.js');
const printLogsDate = require('../../utils/printLogs.js');

const MyGroups = express.Router();

MyGroups.get('/', Auth, (req, res) => {
    if (!req.cookies.has_visited)
    {
        req.cookies('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('MyGroups');
    const userId = req.session.userId;
    printLogsDate(`User with Id ${userId} viewed Groups list at : `);
});

module.exports = MyGroups;