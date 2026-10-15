const express = require('express');
const router = express.Router();
const requireAuth = require('../../controllers/middleware');
const getGroupExpenses = require('../../utils/getGroupExpenses');

router.get('/', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const groupId = '6accfbad416c4259988ceb63';
    const groupDetails = await getGroupExpenses(groupId, userId);
    console.dir(groupDetails, { depth: null, colors: true });
    return res.render('Dashboard');
})

module.exports = router;