const express = require('express');
const loginAuth = require('../controllers/LoginAuth');
const router = express.Router();
const {loginLimiter} = require('../middleware/rateLimiter.js');

router.get('/', (req, res) => {
   //  res.render('signup');
   res.status(200).json({ message: 'Login page rendered successfully.' });
});

router.post('/', loginLimiter, loginAuth);

module.exports = router;