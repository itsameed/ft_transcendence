const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
const mongoose = require('mongoose');

const userdate = require("./models/articleSchema");
app.set('view engine', 'ejs')

app.use(express.static('public'))

const path = require("path");
const livereload = require("livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));


// const connectLivereload = require("connect-livereload");
// app.use(connectLivereload());

// liveReloadServer.server.once("connection", () => {
//   setTimeout(() => {
//     liveReloadServer.refresh("/");
//   }, 100);
// });

// let players = [
//     { name: "ameed", id: 1, scour: 1000 },
//     { name: "player1", id: 2, scour: 100 },
//     { name: "player2", id: 3, scour: 10 },
//     { name: "player3", id: 4, scour: 1 },
// ]

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile('./views/index.html', { root: __dirname });
})

app.get('/welcome', (req, res) => {
    userdate.find().then((dateuser) => {
        res.render('welcome', { oarr: dateuser })
    }).catch((err) => {
        console.log(err);
    })
})

app.get('/users', (req, res) => {
    userdate.find().then((dateuser) => {
        res.render('users', { title: "users", users: dateuser })
    }).catch((err) => {
        console.log(err);
    })
})

app.post('/', (req, res) => {
    const _userdate = new userdate({
        username: req.body.username,
        useremail: req.body.useremail,
        userage: req.body.userage
    });
    _userdate.save().then((() => {
        res.status(201).redirect('/welcome')
    })).catch(((err) => {
        console.log(err);
    }))
})

// app.put('/update/:playerid', (req, res) => {
//     let { playerid } = req.params;
//     if (playerid) {
//         let foundplayer = players.find((item) => item.id === Number(playerid));
//         let index = players.indexOf(foundplayer);
//         players[index] = {
//             ...foundplayer,
//             scour: 9999
//         }
//         res.status(200).json({
//             message: `player whit this ID ${playerid} is updated`,
//             data: players[index],
//         })
//     }

// })

app.get('/users/:userid', async (req, res) => {

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
});

app.post('/users/:userid/delete', async (req, res) => {

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
});

app.get('/users/:userid/edit', async (req, res) => {

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
});

app.post("/users/:userid/edit", async (req, res) => {

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
});

// app.delete('/:playerid', (req, res) => {
//     const { playerid } = req.params;
//     const foundplayer = players.find((item) => item.id === Number(playerid));
//     if (!foundplayer) {
//         res.status(500).json({
//             message: `player whit this ID ${playerid} not found`,
//         })
//     } else {
//         const newplayers = players.filter((item) => item.id !== Number(playerid));
//         if (newplayers) {
//             players = newplayers;
//             res.status(200).json({
//                 message: `player whit this ID ${playerid} deleted`,
//                 data: newplayers,
//             })
//         }
//     }
// })

mongoose.connect('mongodb+srv://ameed:ameed123@cluster0.vdbjb1y.mongodb.net/?appName=Cluster0')
    .then(() => {
        app.listen(6664, () => {
            console.log("app is running in http://localhost:6664");
        });
    })
    .catch((err) => { console.log(err) });