const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const getUserInfo = require('../utils/getUserInfos');
const cookieAuth = require('../middleware/cookieAuth');

router.get('/', requireAuth, cookieAuth,  getUserInfo);

module.exports = router;