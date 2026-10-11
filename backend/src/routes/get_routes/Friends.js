import express from 'express';
import Auth from '../../controllers/middleware.js';
import printLogsDate from '../../utils/printLogs.js';

const Friends = express.Router();

Friends.get('/', Auth, (req, res) => {
    const userId = req.session.useId;
    printLogsDate(`User with Id ${userId} viewed Friends list at : `);
    if (!req.cookies.has_visited)
    {
        req.cookies('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Friends');
});

export default Friends;