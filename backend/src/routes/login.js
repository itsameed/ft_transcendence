const express = require('express');
const printLogsDate = require('../utils/printLogs');
const loginAuth = require('../utils/LoginAuth');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('signup');
});

router.post('/', loginAuth);

module.exports = router;