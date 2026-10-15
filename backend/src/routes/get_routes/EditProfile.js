const express = require('express');
const router = express.Router();
const requireAuth = require('../../controllers/middleware');
const User = require('../../models/Schemas/User');

router.get('/', requireAuth, async (req, res) => {
    const currentUser = await User.findById(req.session.userId);
    res.render('EditProfile', { currentUser });
});

module.exports = router;