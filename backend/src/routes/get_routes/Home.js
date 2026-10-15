const express = require('express');
const requireAuth = require('../../controllers/middleware');
const calculateUserBalances = require('../../utils/calculateUserBalance');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const formattedGroups = await calculateUserBalances(userId);
    if (!req.cookies.has_visited)
    {
        res.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    else
        res.send({formattedGroups});
})

module.exports = router;