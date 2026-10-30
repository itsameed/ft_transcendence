const express = require('express');
const loginAuth = require('../controllers/LoginAuth');
const router = express.Router();

router.get('/', (req, res) => {
   //  res.render('signup');
   res.status(200).json({ message: 'Login page rendered successfully.' });
});

router.post('/', loginAuth);

module.exports = router;