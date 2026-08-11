const express = require('express');
const app = express();

let players = [
    {name:"ameed", id:1, scour:1000},
    {name:"player1", id:2, scour:100},
    {name:"player2", id:3, scour:10},
    {name:"player3", id:4, scour:1},
]

app.use(express.json());
app.get('', (req, res) => {
    res.send(players);
})

app.post('/add', (req, res) => {
    let {newplayer} = req.body;
    let newPlayer = {
        id: players.length + 1,
        ...newplayer
    }
    players.push(newPlayer);
    res.status(200).json({
        data: players,
    })
})

app.put('/update/:playerid', (req, res) => {
    let {playerid} = req.params;
    if(playerid)
        {
            let foundplayer = players.find((item) => item.id === Number(playerid));
            let index = players.indexOf(foundplayer);
            players[index] = {
                ...foundplayer,
                scour:9999
            }
            res.status(200).json({
                message: `player whit this ID ${playerid} is updated`,
                data: players[index],
            })
        }

})

app.get('/:playerid', (req, res) => {
    const {playerid} = req.params;
    const foundplayer = players.find((item) => item.id === Number(playerid));
    if(!foundplayer)
        {
            res.send(`player whit this ID ${playerid} not found`);
    }else{
        res.send(foundplayer);
    }
})

app.delete('/:playerid', (req, res) => {
    const {playerid} = req.params;
    const foundplayer = players.find((item) => item.id === Number(playerid));
    if(!foundplayer)
        {
            res.status(500).json({
                message: `player whit this ID ${playerid} not found`,
            })
    }else{
        const newplayers = players.filter((item) => item.id !== Number(playerid));
        if(newplayers){
            players = newplayers;
            res.status(200).json({
                message: `player whit this ID ${playerid} deleted`,
                data: newplayers,
            })
        }
    }
})


app.listen(6664, () =>
    {
        console.log("app is running in http://localhost:6664");
    });