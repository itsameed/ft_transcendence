const { userdate } = require("../models/articleSchema");

const getWelcome = async (req, res) => {
    try {
        const dateuser = await userdate.find();

        res.render("welcome", {
            oarr: dateuser
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Something went wrong");
    }
};

const createUser = async (req, res) => {
    try {
        const _userdate = new userdate({
            username: req.body.username,
            useremail: req.body.useremail,
            userage: req.body.userage
        });

        await _userdate.save();

        res.status(201).redirect("/welcome");

    } catch (err) {
        console.log(err);
        res.status(500).send("Something went wrong");
    }
};

const getUsers = async (req, res) => {
    try {
        const dateuser = await userdate.find();

        res.render("users", {
            title: "users",
            users: dateuser
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Something went wrong");
    }
};

const getUsersByid =  async (req, res) => {

    try {

        const { userid } = req.params;

        const founduser = await userdate.findById(userid);

        if (!founduser) {
            return res.status(404).send(
                `User with this ID ${userid} not found`
            );
        }

        res.render('profile', {
            title: "User Profile",
            user: founduser
        });

    } catch (err) {

        console.log(err);
        res.status(500).send("Something went wrong");

    }
};

const deleteUserByid = async (req, res) => {

    try {

        const { userid } = req.params;

        const founduser = await userdate.findByIdAndDelete(userid);

        if (!founduser) {
            return res.status(404).send(
                `User with this ID ${userid} not found`
            );
        }

        res.redirect("/users");
    } catch (err) {

        console.log(err);
        res.status(500).send("Something went wrong");

    }
};

const getEditByid = async (req, res) => {

    try {

        const { userid } = req.params;

        const founduser = await userdate.findById(userid);

        if (!founduser) {
            return res.status(404).send(
                `User with this ID ${userid} not found`
            );
        }

        res.render('edit', {
            title: "Update",
            user: founduser
        });
    } catch (err) {

        console.log(err);
        res.status(500).send("Something went wrong");

    }
};

const editUserByid = async (req, res) => {

    try {

        const { userid } = req.params;

        const { username, useremail, userage } = req.body;

        const updatedUser = await userdate.findByIdAndUpdate(
            userid,
            {
                username: username,
                useremail: useremail,
                userage: userage
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.redirect("/users");

    } catch (err) {

        console.log(err);
        res.status(500).send("Something went wrong");

    }
};

module.exports = {
    getWelcome,
    createUser,
    getUsers,
    getUsersByid,
    deleteUserByid,
    getEditByid,
    editUserByid,
};