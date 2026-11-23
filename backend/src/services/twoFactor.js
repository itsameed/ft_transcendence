const crypto = require('crypto');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const { authenticator: baseAuthenticator } = require('otplib');

const ISSUER = 'Splitify';
const STEP_SECONDS = 30;
const RECOVERY_CODE_COUNT = 10;

// Accept the previous and next 30s code too, to absorb phone clock drift.
const authenticator = baseAuthenticator.clone({ window: 1, step: STEP_SECONDS });

/* ── Secret encryption (AES-256-GCM) ─────────────────────────────── */

function encryptionKey() {
    const hex = process.env.TWOFA_ENC_KEY || '';
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
    return Buffer.from(hex, 'hex');
}

function isConfigured() {
    return encryptionKey() !== null;
}

function encryptSecret(plain) {
    const key = encryptionKey();
    if (!key) throw new Error('TWOFA_ENC_KEY is not set');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ['v1', iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':');
}

function decryptSecret(stored) {
    const key = encryptionKey();
    if (!key) throw new Error('TWOFA_ENC_KEY is not set');
    const [version, iv, tag, data] = String(stored).split(':');
    if (version !== 'v1') throw new Error('Unknown 2FA secret format');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}

/* ── TOTP ────────────────────────────────────────────────────────── */

function generateSecret() {
    return authenticator.generateSecret(20); // 160-bit, the RFC 4226 recommendation
}

async function setupPayload(secret, accountName) {
    const otpauthUrl = authenticator.keyuri(accountName, ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
    return { otpauthUrl, qrDataUrl, secret };
}

function normalizeCode(code) {
    return String(code ?? '').replace(/\s+/g, '');
}

/**
 * Checks a 6-digit code. Returns the 30s time-step it matched, or null.
 * Callers store the step and pass it back as `lastStep`, so the same code
 * can't be replayed within its validity window.
 */
function verifyCode(secret, code, lastStep) {
    const token = normalizeCode(code);
    if (!/^\d{6}$/.test(token)) return null;
    const delta = authenticator.checkDelta(token, secret);
    if (delta === null) return null;
    const step = Math.floor(Date.now() / 1000 / STEP_SECONDS) + delta;
    if (typeof lastStep === 'number' && step <= lastStep) return null;
    return step;
}

/* ── Recovery codes ──────────────────────────────────────────────── */

function normalizeRecoveryCode(code) {
    return String(code ?? '').toLowerCase().replace(/[^0-9a-f]/g, '');
}

/** Returns { codes, hashes }: show `codes` once, store only `hashes`. */
async function generateRecoveryCodes() {
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => {
        const hex = crypto.randomBytes(5).toString('hex');
        return `${hex.slice(0, 5)}-${hex.slice(5)}`;
    });
    const hashes = await Promise.all(codes.map((c) => bcrypt.hash(normalizeRecoveryCode(c), 10)));
    return { codes, hashes };
}

/** Returns the index of the matching hash, or -1. */
async function matchRecoveryCode(code, hashes) {
    const normalized = normalizeRecoveryCode(code);
    if (normalized.length !== 10 || !Array.isArray(hashes)) return -1;
    for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(normalized, hashes[i])) return i;
    }
    return -1;
}

const SECRET_FIELDS = '+twoFactorSecret +twoFactorPendingSecret +twoFactorLastStep +twoFactorRecoveryCodes';

module.exports = {
    SECRET_FIELDS,
    isConfigured,
    encryptSecret,
    decryptSecret,
    generateSecret,
    setupPayload,
    verifyCode,
    generateRecoveryCodes,
    matchRecoveryCode,
};
