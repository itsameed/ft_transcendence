const express = require(`express`);
const PSignup = express.Router();
const bcrypt = require('bcrypt');
const User = require(`../../Schemas/User`);


PSignup.post('/', async (req, res) => {
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    // process.stdout.write("user with id : ");
    // process.stdout.write(req.session.userId);
    // process.stdout.write(" username : ");
    // process.stdout.write(req.username);
    // process.stdout.write(" signed up at ");
    // const date = new Date();
    // const currentDate = date.toLocaleString();
    // console.log(currentDate);
    const newUser = new User({
        username: req.body.fullName,
        email: req.body.email,
        password: hashedPass,
        // _id: req.sessionID,
    });
    try{
        console.log('user is being saved');
        await newUser.save();
    }
    catch(error){
        console.log(error.message);
        if (error.code == 11000)
            res.send("This email is already registered. please use another one instead!");
        else
            console.log("An error occurred while saving the user");
    }
    // await newUser.save();
    console.log("Received signup data :", req.body);
    // res.send("Data Received successfully");
    return res.redirect(`Dashboard`);
})


module.exports = PSignup;