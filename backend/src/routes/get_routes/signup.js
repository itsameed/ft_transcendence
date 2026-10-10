import express from 'express';

const Signup = express.Router();

Signup.get(`/`, (req, res) => {
    // console.log("sdff");
    res.render(`signup`);
});

export default Signup;