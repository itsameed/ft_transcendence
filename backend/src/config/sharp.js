const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const sharp = require('sharp');

const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const AVATAR_SIZE = 500;

/**
 * Validates and re-encodes an uploaded avatar, then writes it to disk.
 * Returns the public URL path, or null when no file was sent.
 */
async function saveAvatar(file, userId) {
    if (!file?.buffer?.length) return null;

    await fs.mkdir(AVATAR_DIR, { recursive: true });

    // Re-encoding through sharp is the real validation: a non-image buffer
    // throws here, and metadata (EXIF/GPS) is dropped by default.
    const image = sharp(file.buffer, { failOn: 'error' }).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) {
        throw Object.assign(new Error('That file is not a readable image.'), { status: 400 });
    }

    const filename = `${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    const outputPath = path.join(AVATAR_DIR, filename);

    await image
        .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outputPath);

    return `/uploads/avatars/${filename}`;
}

/** Best-effort removal of a previous upload; default avatars are left alone. */
async function removeAvatar(avatarPath) {
    if (typeof avatarPath !== 'string' || !avatarPath.startsWith('/uploads/avatars/')) return;
    const filename = path.basename(avatarPath);
    try {
        await fs.unlink(path.join(AVATAR_DIR, filename));
    } catch {
        // Already gone — nothing to clean up.
    }
}

module.exports = { saveAvatar, removeAvatar, AVATAR_DIR };
