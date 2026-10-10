import express from 'express';

const Login = express.Router();

Login.get(`/`, (req, res) => {
    // console.log(gogo);
    // if (!req.cookies.has_visited)
    // {
    //     res.cookie('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
    //     res.render('signup');
    // }
    // else
    res.render('signup');
});

export default Login;