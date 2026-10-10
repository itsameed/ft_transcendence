const express = require(`express`);
const bcrypt = require('bcrypt');

const PLogin = express.Router();
const User = require(`../../models/Schemas/User`);


PLogin.post(`/`, async (req, res) => {
    // console.log("Received login data :", req.body);
    const {email, password} = req.body;
    if (!email || !password)
        return res.status(400).send(`Email and Password are required!`);
    const user = await User.findOne({ email });
    if (!user)
        return res.status(404).send(`Invalid credentials . please try again !`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!user || !isMatch)
        return res.status(401).send(`Invalid credentials . please try again !`);
    req.session.userId = user._id;
    req.session.username = user.fullName;
    //     console.log(`login here`);
    // process.stdout.write("user with id : ");
    // process.stdout.write(req.session.userId);
    // process.stdout.write(" Logged in at ");
    // const date = new Date();
    // const currentDate = date.toLocaleString();
    // console.log(currentDate);
    return res.redirect(`Dashboard`);
})

// PLogin.post('/', async (req, res) => {
//     const { email, password } = req.body;

//     // ✅ Validate inputs FIRST
//     if (!email || !password) {
//         return res.status(400).send("Email and password are required.");
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//         return res.status(401).send("Invalid email or password");
//     }

//     // ✅ Now safe to compare — both values are guaranteed to exist
//     const isMatch = await bcrypt.compare(password, user.password);
    
//     if (!isMatch) {
//         return res.status(401).send("Invalid email or password");
//     }

//     // Success...
// });


module.exports = PLogin;