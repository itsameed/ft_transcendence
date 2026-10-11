import express from 'express';
import Auth from '../../controllers/middleware.js';
import printLogsDate from '../../utils/printLogs.js';

const Notifications = express.Router();

Notifications.get('/', Auth, (req, res) => {
    if(!req.cookies.has_visited)
    {
        req.cookies('has_visited', 'true', {maxAge: 365 * 424 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Notifications');
    const userId = req.session.userId;
    printLogsDate(`User with Id ${userId} viewed Notifications list at : `);
});

export default Notifications;