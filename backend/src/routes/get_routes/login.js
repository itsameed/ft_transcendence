import express from 'express';

const Login = express.Router();

Login.get(`/`, (req, res) => {
    res.render('signup');
});

export default Login;