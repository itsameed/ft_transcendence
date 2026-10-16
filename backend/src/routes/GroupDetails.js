const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const getGroupExpenses = require('../utils/getGroupExpenses');

router.get('/', requireAuth, getGroupExpenses)

module.exports = router;