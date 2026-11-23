const User = require('../models/Schemas/User');
const twoFactor = require('../services/twoFactor');
const printLogsDate = require('./printLogs');

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function regenerate(req) {
    return new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
}

function save(req) {
    return new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
}

/**
 * Called once the first factor (password or Google) has passed for an
 * account with 2FA on. The session gets a short-lived challenge but no
 * `userId`, so every protected route still treats the visitor as logged out.
 * Regenerating also drops passport's login from the Google flow.
 */
async function startChallenge(req, user, method) {
    await regenerate(req);
    req.session.pending2fa = {
        userId: String(user._id),
        method,
        expiresAt: Date.now() + CHALLENGE_TTL_MS,
        attempts: 0,
    };
    await save(req);
}

/** POST /auth/login/2fa { code } or { recoveryCode } */
async function verifyLoginCode(req, res, next) {
    try {
        const pending = req.session?.pending2fa;
        if (!pending || pending.expiresAt < Date.now()) {
            if (pending) {
                delete req.session.pending2fa;
                await save(req);
            }
            return res.status(401).json({ message: 'Your sign-in expired. Please sign in again.', restart: true });
        }

        const user = await User.findById(pending.userId).select(twoFactor.SECRET_FIELDS);
        if (!user || !user.twoFactorEnabled) {
            delete req.session.pending2fa;
            await save(req);
            return res.status(401).json({ message: 'Please sign in again.', restart: true });
        }
        if (user.status === 'suspended') {
            delete req.session.pending2fa;
            await save(req);
            return res.status(403).json({ message: 'Your account is suspended' });
        }

        const { code, recoveryCode } = req.body ?? {};
        const used = await twoFactor.verifySecondFactor(user, { code, recoveryCode });
        if (!used) {
            pending.attempts += 1;
            if (pending.attempts >= MAX_ATTEMPTS) {
                delete req.session.pending2fa;
                await save(req);
                return res.status(401).json({ message: 'Too many wrong codes. Please sign in again.', restart: true });
            }
            await save(req);
            return res.status(400).json({
                message: recoveryCode ? 'That recovery code didn’t work.' : 'That code didn’t match. Try the newest one from your app.',
            });
        }
        await user.save();

        // Fresh session id for the real login (guards against session fixation).
        await regenerate(req);
        req.session.userId = String(user._id);
        req.session.username = user.username;
        await save(req);

        printLogsDate(`User with Id ${user._id} passed 2FA (${used}) at : `);
        const isAdmin = user.role === 'admin' || user.username === 'admin' || user.email === 'admin@splitify.test';
        return res.json({
            message: 'Login successful.',
            userId: user._id,
            username: user.username,
            email: user.email,
            role: isAdmin ? 'admin' : (user.role || 'user'),
            usedRecoveryCode: used === 'recovery',
            recoveryCodesLeft: user.twoFactorRecoveryCodes?.length ?? 0,
        });
    } catch (error) {
        return next(error);
    }
}

/** POST /auth/login/2fa/cancel: back out to the password step. */
async function cancelChallenge(req, res, next) {
    try {
        if (req.session?.pending2fa) {
            delete req.session.pending2fa;
            await save(req);
        }
        return res.json({ ok: true });
    } catch (error) {
        return next(error);
    }
}

/** GET /auth/login/2fa: lets the login page resume a pending challenge. */
function challengeStatus(req, res) {
    const pending = req.session?.pending2fa;
    const active = Boolean(pending && pending.expiresAt > Date.now());
    return res.json({ pending: active, method: active ? pending.method : null });
}

module.exports = { startChallenge, verifyLoginCode, cancelChallenge, challengeStatus };
