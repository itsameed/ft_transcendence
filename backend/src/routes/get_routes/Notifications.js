import express from 'express';
import Auth from '../../controllers/middleware.js';

const Notifications = express.Router();

Notifications.get('/', Auth, (req, res) => {
    process.stdout.write("user with id : ");
    process.stdout.write(req.session.userId);
    process.stdout.write(" navigated to notifications bar at : ");
    const date = new Date();
    const currentDate = date.toLocaleString();
    console.log(currentDate);
    if(!req.cookies.has_visited)
    {
        req.cookies('has_visited', 'true', {maxAge: 365 * 424 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Notifications');
});

export default Notifications;