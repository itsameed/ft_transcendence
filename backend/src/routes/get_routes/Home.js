const express = require(`express`);
const Auth = require(`../../controllers/middleware`);

const Home = express.Router();


Home.get('/', Auth, (req, res) => {
    if (!req.cookies.has_visited)
    {
        req.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.render('Dashboard');
    // console.log(req.originalUrl);
})

module.exports = Home;