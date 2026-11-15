// Default avatars ship with the frontend build (frontend/public/avatars).
// The backend only needs the ids so it can reject anything else.
const DEFAULT_AVATARS = [
    'aurora',
    'clay',
    'stone',
    'slate',
    'moss',
    'plum',
    'sand',
    'ink',
];

const DEFAULT_AVATAR_PREFIX = '/avatars/';
const UPLOAD_AVATAR_PREFIX = '/uploads/avatars/';

function defaultAvatarPath(id) {
    return `${DEFAULT_AVATAR_PREFIX}${id}.svg`;
}

/** Normalises a client-supplied avatar choice to a known default path, or null. */
function resolveDefaultAvatar(value) {
    if (typeof value !== 'string') return null;
    const id = value.startsWith(DEFAULT_AVATAR_PREFIX)
        ? value.slice(DEFAULT_AVATAR_PREFIX.length).replace(/\.svg$/, '')
        : value;
    return DEFAULT_AVATARS.includes(id) ? defaultAvatarPath(id) : null;
}

/** A stable default so every account has an avatar without the user choosing one. */
function pickDefaultAvatar(seed) {
    const text = String(seed || '');
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) % 100000;
    }
    return defaultAvatarPath(DEFAULT_AVATARS[hash % DEFAULT_AVATARS.length]);
}

module.exports = {
    DEFAULT_AVATARS,
    DEFAULT_AVATAR_PREFIX,
    UPLOAD_AVATAR_PREFIX,
    defaultAvatarPath,
    resolveDefaultAvatar,
    pickDefaultAvatar,
};
