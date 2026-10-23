const express = require('express');
const printLogsDate = require('../controllers/printLogs');
const loginAuth = require('../controllers/LoginAuth');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('signup');
});

router.post('/', loginAuth);

module.exports = router;