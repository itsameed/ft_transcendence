const express = require('express');
const loadNewUser = require('../controllers/loadNewUser');
const router = express.Router();
const upload = require('../config/multer');

// Accepts JSON (no photo) or multipart (optional `avatar` file).
router.post('/', upload.single('avatar'), loadNewUser);

module.exports = router;
