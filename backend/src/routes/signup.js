const express = require('express');
const loadNewUser = require('../controllers/loadNewUser');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const cookieAuth = require('../middleware/cookieAuth');

router.get('/', (req, res) => {
    // console.log("sdff");
    res.render(`signup`);
});

router.post('/', requireAuth, cookieAuth, loadNewUser);

module.exports = router;