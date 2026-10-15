const express = require('express');
const requireAuth = require('../../controllers/middleware.js');
const printLogsDate = require('../../utils/printLogs.js');
const getGroupsData = require('../../utils/getGroupsData');
// const getUserGroups = require('../../controllers/get');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    if (!req.cookies.has_visited)
    {
        req.cookies('has_visited', 'true', {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
    {
        const groupData = await getGroupsData(req.session.userId);
        res.send({groupData});
    }
    const userId = req.session.userId;
    printLogsDate(`User with Id ${userId} viewed Groups list at : `);
});

module.exports = router;