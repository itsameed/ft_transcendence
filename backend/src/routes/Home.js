const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const calculateUserBalances = require('../utils/calculateUserBalance');
const router = express.Router();
const cookieAuth = require('../middleware/cookieAuth');

router.get('/', requireAuth, cookieAuth, calculateUserBalances)

module.exports = router;