const express = require('express');
const requireAuth = require('../middleware/requireAuth.js');
const printLogsDate = require('../controllers/printLogs.js');
const createExpense = require('../controllers/createExpense.js');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
    printLogsDate(`User with Id ${userId} viewed Expenses list at : `);
    res.render(`createExpense`);
});

router.post('/', requireAuth, createExpense);

module.exports = router;