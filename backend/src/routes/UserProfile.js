const express = require('express');
const apiAuth = require('../middleware/apiAuth');
const getPublicProfile = require('../controllers/getPublicProfile');

const router = express.Router();

router.get('/:userId/profile', apiAuth, getPublicProfile);

module.exports = router;
