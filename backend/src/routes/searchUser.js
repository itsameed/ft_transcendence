const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const cookieAuth = require('../middleware/cookieAuth');
const getUserSearch = require('../controllers/getUserSearch');


router.get('/', requireAuth, cookieAuth, getUserSearch);


module.exports = router;