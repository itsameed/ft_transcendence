const express = require('express');
const loadNewUser = require('../controllers/loadNewUser');
const router = express.Router();
// const requireAuth = require('../middleware/requireAuth');
// const cookieAuth = require('../middleware/cookieAuth');
const upload = require('../config/multer');
const resizeImage = require('../config/sharp');

router.post('/', upload.single('avatar'), resizeImage,  loadNewUser);

module.exports = router;