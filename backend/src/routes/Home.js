const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const getAllUserInfos = require('../controllers/getAllUserInfos');
const router = express.Router();
const cookieAuth = require('../middleware/cookieAuth');

router.get('/', requireAuth, cookieAuth, getAllUserInfos)

module.exports = router;