const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const upload = require('../config/multer');
const updateAvatar = require('../controllers/updateAvatar');

const avatarLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many avatar changes. Try again later.' },
});

router.post('/', requireAuth, avatarLimiter, upload.single('avatar'), updateAvatar);

module.exports = router;
