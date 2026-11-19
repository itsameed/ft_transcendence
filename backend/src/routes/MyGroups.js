const express = require('express');
const requireAuth = require('../middleware/requireAuth.js');
const printLogsDate = require('../utils/printLogs.js');
const getGroupsData = require('../utils/getGroupsData');
// const getUserGroups = require('../controllers/get');
const cookieAuth = require('../middleware/cookieAuth.js');
const router = express.Router();

router.get('/', requireAuth, cookieAuth, getGroupsData, (req, res) => {
    const userId = req.session.userId;
    printLogsDate(`User with Id ${userId} viewed Groups list at : `);
});

module.exports = router;