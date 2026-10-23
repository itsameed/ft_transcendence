const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const cookieAuth = require('../middleware/cookieAuth');
const editUserProfile = require('../controllers/editUserProfile');

router.get('/', requireAuth, async (req, res, next) => {
    const currentUser = await User.findById(req.session.userId);
    res.render('EditProfile', { currentUser });
});

router.patch('/', requireAuth, cookieAuth, editUserProfile);

module.exports = router;