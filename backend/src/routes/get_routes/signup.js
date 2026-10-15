const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    // console.log("sdff");
    res.render(`signup`);
});

module.exports = router;