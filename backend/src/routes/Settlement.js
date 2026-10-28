const express = require('express');
const requireAuth = require('../middleware/requireAuth.js');
const printLogsDate = require('../controllers/printLogs.js');
const cookieAuth = require('../middleware/cookieAuth');
const getSettlements = require('../controllers/getSettlements.js');
const addSettlement = require('../controllers/addSettlement.js');
const router = express.Router();

router.get('/', requireAuth, cookieAuth, getSettlements);

router.post('/', requireAuth, cookieAuth, addSettlement);

module.exports = router;