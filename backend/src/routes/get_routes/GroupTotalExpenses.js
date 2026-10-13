const express = require('express');
const Auth = require('../../controllers/middleware');
const GroupTotalExpenses = express.Router();
const GroupTotalExpensesFunc = require('../../utils/GroupTotalExpenses');

GroupTotalExpenses.get('/', Auth, async (req, res) => {
    const userId = req.session.userId;
    const GroupInfos = await GroupTotalExpensesFunc(req.groupId, userId);
    console.dir(GroupInfos, {colors: true});
    res.send({GroupInfos});
})

module.exports = GroupTotalExpenses;