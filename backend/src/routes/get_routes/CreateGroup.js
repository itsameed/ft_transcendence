const express = require(`express`);
const Auth = require(`../../controllers/middleware`);
const CreateGroup = express.Router();
const GroupSchema = require(`../../models/Schemas/Group`);



CreateGroup.get('/', Auth, async (req, res) =>
{
    res.render('CreateGroup');
});

// CreateGroup.post('/', Auth, (req,res) => {
//     const newGroup = new GroupSchema({
//         owner: {
            

//         },
//         groupName: req.groupname,
//         description: "this is japan trip group",
//         members: [],
//         createdAt: Date.now
//     });
// })

module.exports = CreateGroup;