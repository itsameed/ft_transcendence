const express = require('express');
const router = express.Router();
const requireAuth = require('../../controllers/middleware');
const getUserInfo = require('../../utils/getUserInfos');

router.get('/', requireAuth, async (req, res) => {
    res.send(await getUserInfo(req.session.userId));
});

module.exports = router;