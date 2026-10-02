const express = require(`express`);
const Auth = require(`../../controllers/middleware`);

const Friends = express.Router();


Friends.get('/', Auth, (req, res) => {
    process.stdout.write("user with id : ");
    process.stdout.write(req.session.userId);
    process.stdout.write(" navigated to friends list at : ");
    const date = new Date();
    const currentDate = date.toLocaleString();
    console.log(currentDate);
    if (!req.cookies.has_visited)
    {
        req.cookies('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Friends');
});


module.exports = Friends;