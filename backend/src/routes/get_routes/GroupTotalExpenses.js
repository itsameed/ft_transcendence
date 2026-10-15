const express = require('express');
const requireAuth = require('../../controllers/middleware');
const router = express.Router();
const calculateGroupTotalExpenses = require('../../utils/GroupTotalExpenses');

router.get('/', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const groupInfo = await calculateGroupTotalExpenses(req.groupId, userId);
    console.dir(groupInfo, {colors: true});
    res.send({ GroupInfos: groupInfo });
});

module.exports = router;