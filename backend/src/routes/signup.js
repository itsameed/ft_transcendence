const express = require('express');
const loadNewUser = require('../controllers/loadNewUser');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const cookieAuth = require('../middleware/cookieAuth');
const upload = require('../config/multer');

router.get('/', (req, res) => {
    // console.log("sdff");
    console.log('reached here');
    res.render(`signup`);
});

router.post('/', requireAuth, cookieAuth, upload.single('avatar'), loadNewUser);

module.exports = router;