import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { MongoTailableCursorError } from 'mongodb';

// Route Imports (with .js extensions)
import FriendsList from './routes/get_routes/Friends.js';
import Login from './routes/get_routes/login.js';
import postLogin from './routes/post_routes/login.js';
import postSignup from './routes/post_routes/signup.js';
import Notif from './routes/get_routes/Notifications.js';
import Groups from './routes/get_routes/MyGroups.js';
import Homepage from './routes/get_routes/Home.js';
import Signup from './routes/get_routes/signup.js';
import postCreateGroup from './routes/post_routes/createGroup.js';
import getCreateGroup from './routes/get_routes/CreateGroup.js';
import getExpenses from './routes/get_routes/Expenses.js';
import postExpense from './routes/post_routes/createExpense.js';

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl: process.env.MONGO_URL,
    }),
    cookie: {
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }

}));

mongoose.connect('mongodb://127.0.0.1:27017/ft_transcendence');
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