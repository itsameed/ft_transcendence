const express = require('express');
const router = express.Router();
const requireAuth = require('../../controllers/middleware');

router.get('/', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.status(500).sne ('Error Logging out');
        }
        res.clearCookie('connect.sid');

        res.redirect('/login');
    })
});

module.exports = router;