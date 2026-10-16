const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const destroySession = require('../utils/destroySession');

router.get('/', requireAuth, destroySession);

module.exports = router;