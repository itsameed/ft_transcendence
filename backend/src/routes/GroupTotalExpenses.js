const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();
const calculateGroupTotalExpenses = require('../controllers/GroupTotalExpenses');

router.get('/', requireAuth, calculateGroupTotalExpenses);

module.exports = router;