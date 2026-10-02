const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const FriendsList = require('./routes/get_routes/Friends');
const Login = require(`./routes/get_routes/login`);
const Plogin = require(`./routes/post_routes/login`);
const Psignup = require(`./routes/post_routes/signup`);
const Notif = require(`./routes/get_routes/Notifications`);
const Groups = require(`./routes/get_routes/MyGroups`);
const Homepage = require(`./routes/get_routes/Home`);
const Signup = require(`./routes/get_routes/signup`);
const PCreateGroup = require(`./routes/post_routes/createGroup`);
const CreateGroup = require(`./routes/get_routes/CreateGroup`);
const session = require(`express-session`);
const MongoStore = require(`connect-mongo`).default;
const { MongoTailableCursorError } = require('mongodb');
const PORT = 3000;

app.use(session({
    secret: "hello",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl: `mongodb://127.0.0.1:27017/ft_transcendence`
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
app.use('/', Homepage);
app.use('/login', Login);
app.use('/login', Plogin);
app.use(`/signup`, Psignup);
app.use(`/signup`, Signup);
app.use('/Friends', FriendsList);
app.use(`/CreateGroup`, CreateGroup);
app.use(`/CreateGroup`, PCreateGroup);
app.use('/notifications', Notif);
app.use('/MyGroups', Groups);
app.use(`/notifications`, Notif);
app.set("view engine", 'ejs');

// const Group = mongoose.model('Group', new mongoose.Schema ({
//     GroupId: {type: String, unique: true},
//     Owner: String,
// }));



// app.get('/', (req, res) => {
//     if (!req.cookies.has_visited)
//     {   
//         console.log('New Client :', req.ip);
//         res.cookie('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
//         res.render('signup');
//     }
//     else
//     {
//         console.log("dyalna");
//         res.render('Dashboard');
//     }
// })

app.get(`/Dashboard`, (req, res) => {
    // console.log(req.sessionID);
    if (!req.cookies.has_visited)
    {
        res.render(`signup`);
        res.cookie('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
    }
    else
        res.render('Dashboard');
})

app.listen(PORT, () => {
    console.log(`Server is running . Open http://localhost:${PORT}`);
})