const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();
const calculateGroupTotalExpenses = require('../utils/GroupTotalExpenses');

router.get('/', requireAuth, calculateGroupTotalExpenses);

module.exports = router;