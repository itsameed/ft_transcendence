import express from 'express';
import Auth from '../../controllers/middleware.js';
import GroupSchema from '../../models/Schemas/Group.js';

const CreateGroup = express.Router();



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

export default CreateGroup;