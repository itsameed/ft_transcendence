const multer = require('multer');

// Memory storage: sharp re-encodes the buffer and writes the only copy, so a
// rejected or failed upload never leaves an orphan file on disk.
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            return cb(null, true);
        }
        return cb(new Error('Only image files are allowed'));
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
});

module.exports = upload;
