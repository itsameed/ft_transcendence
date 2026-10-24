const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, 'uploads/avatars')
    },
    filename: (req, res, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName)
    }
})

const fileFilter = (req, res, cb) => {
    if (file.mimetype.startswith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer ({
    storage: storage,
    fileFilter: fileFilter,
    limits : {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    }
})

module.exports = upload;