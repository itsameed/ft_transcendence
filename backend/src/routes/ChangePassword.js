const express = require('express');
const apiAuth = require('../middleware/apiAuth');
const changePassword = require('../controllers/changePassword');

const router = express.Router();

router.post('/', apiAuth, changePassword);

module.exports = router;
