const express = require('express');
const requireAuth = require('../../controllers/middleware.js');
const printLogsDate = require('../../utils/printLogs.js');

const router = express.Router();



router.get('/', requireAuth, async (req, res) =>
{
    printLogsDate(`User with Id : ${req.session.userId} Attempted creating a group at :`);
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

module.exports = router;