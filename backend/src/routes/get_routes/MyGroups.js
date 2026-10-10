import express from 'express';
import Auth from '../../controllers/middleware.js';

const MyGroups = express.Router();

MyGroups.get('/', Auth, (req, res, next) => {
    process.stdout.write("user with id : ");
    process.stdout.write(req.session.userId);
    process.stdout.write(" navigated to groups list at : ");
    const date = new Date();
    const currentDate = date.toLocaleString();
    console.log(currentDate);
    if (!req.cookies.has_visited)
    {
        req.cookies('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('MyGroups');
});

export default MyGroups;