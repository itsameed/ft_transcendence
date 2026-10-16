const express = require('express');
const requireAuth = require('../middleware/requireAuth.js');
const printLogsDate = require('../utils/printLogs.js');
const cookieAuth = require('../middleware/cookieAuth');
const getSettlements = require('../utils/getSettlements');
const addSettlement = require('../utils/addSettlement');
const router = express.Router();

router.get('/', requireAuth, cookieAuth, getSettlements);

router.post('/', requireAuth, cookieAuth, addSettlement);

module.exports = router;