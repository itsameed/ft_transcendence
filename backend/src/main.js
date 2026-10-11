require('dotenv/config');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const { MongoTailableCursorError } = require('mongodb');

// Route Imports (with .js extensions)
const FriendsList = require('./routes/get_routes/Friends.js');
const Login = require('./routes/get_routes/login.js');
const postLogin = require('./routes/post_routes/login.js');
const postSignup = require('./routes/post_routes/signup.js');
const Notif = require('./routes/get_routes/Notifications.js');
const Groups = require('./routes/get_routes/MyGroups.js');
const Homepage = require('./routes/get_routes/Home.js');
const Signup = require('./routes/get_routes/signup.js');
const postCreateGroup = require('./routes/post_routes/createGroup.js');
const getCreateGroup = require('./routes/get_routes/CreateGroup.js');
const getExpenses = require('./routes/get_routes/Expenses.js');
const postExpense = require('./routes/post_routes/createExpense.js');

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
    }),
    cookie: {
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }

}));

mongoose.connect(process.env.MONGO_URL);
app.use(express.urlencoded({extended: true}));
app.use(express.static(`public`));
app.use(cookieParser());
app.use('/dashboard', Homepage);
app.use('/login', Login);
app.use('/login', postLogin);
app.use(`/signup`, postSignup);
app.use(`/signup`, Signup);
app.use('/Friends', FriendsList);
app.use(`/CreateGroup`, postCreateGroup);
app.use(`/CreateGroup`, getCreateGroup);
app.use('/notifications', Notif);
app.use('/MyGroups', Groups);
// app.use(`/notifications`, Notif);
app.use(`/createExpense`, postExpense);
app.use(`/getExpenses`, getExpenses);
app.set("view engine", 'ejs');

app.listen(process.env.PORT, () => {
    console.log(`Server is running . Open http://localhost:${process.env.PORT}`);
})