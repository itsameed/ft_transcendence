const sharp = require('sharp');


async function resizeImage(req, res, next) {
    if (!req.file)
        return next();
    try {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const outputPath = path.join('upload/avatars', filename);

        await sharp(req.file.buffer).resize({
            width: 500,
            height: 500,
            fit: 'inside',
            withoutEnlargement: true,
        }).jpeg({ quality: 80}).toFile(outputPath);

        req.file.filename = fileName;
        req.file.path = outputPath;
        next();
    }
    catch (error) {
        next(error);
    }
}

module.exports = resizeImage;