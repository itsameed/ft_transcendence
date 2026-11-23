const bcrypt = require('bcrypt');
const User = require('../models/Schemas/User');
const twoFactor = require('../services/twoFactor');

const NOT_CONFIGURED = {
    message: 'Two-factor authentication is not available on this server yet.',
};

function loadUser(id) {
    return User.findById(id).select(`${twoFactor.SECRET_FIELDS} +password`);
}

/** GET /api/2fa: what the Settings page needs to render. */
async function status(req, res, next) {
    try {
        const user = await loadUser(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        return res.json({
            enabled: Boolean(user.twoFactorEnabled),
            available: twoFactor.isConfigured(),
            hasPassword: Boolean(user.password),
            recoveryCodesLeft: user.twoFactorEnabled ? (user.twoFactorRecoveryCodes?.length ?? 0) : 0,
        });
    } catch (error) {
        return next(error);
    }
}

/** POST /api/2fa/setup: start enrolment with a fresh pending secret. */
async function setup(req, res, next) {
    try {
        if (!twoFactor.isConfigured()) return res.status(503).json(NOT_CONFIGURED);
        const user = await loadUser(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.twoFactorEnabled) {
            return res.status(409).json({ message: 'Two-factor authentication is already on.' });
        }

        const secret = twoFactor.generateSecret();
        user.twoFactorPendingSecret = twoFactor.encryptSecret(secret);
        await user.save();

        const { qrDataUrl } = await twoFactor.setupPayload(secret, user.email);
        return res.json({ qrDataUrl, secret });
    } catch (error) {
        return next(error);
    }
}

/** POST /api/2fa/enable { code }: confirm the app works, then switch on. */
async function enable(req, res, next) {
    try {
        if (!twoFactor.isConfigured()) return res.status(503).json(NOT_CONFIGURED);
        const user = await loadUser(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.twoFactorEnabled) {
            return res.status(409).json({ message: 'Two-factor authentication is already on.' });
        }
        if (!user.twoFactorPendingSecret) {
            return res.status(400).json({ message: 'Start setup again to get a new QR code.' });
        }

        const secret = twoFactor.decryptSecret(user.twoFactorPendingSecret);
        const step = twoFactor.verifyCode(secret, req.body?.code);
        if (step === null) {
            return res.status(400).json({ message: 'That code didn’t match. Check your app and try the newest code.' });
        }

        const { codes, hashes } = await twoFactor.generateRecoveryCodes();
        user.twoFactorEnabled = true;
        user.twoFactorSecret = user.twoFactorPendingSecret;
        user.twoFactorPendingSecret = undefined;
        user.twoFactorLastStep = step;
        user.twoFactorRecoveryCodes = hashes;
        await user.save();

        return res.json({ enabled: true, recoveryCodes: codes });
    } catch (error) {
        return next(error);
    }
}

/**
 * POST /api/2fa/disable { password?, code?, recoveryCode? }
 * Needs the password (when the account has one) plus a second factor, so a
 * hijacked session alone can't strip 2FA off the account.
 */
async function disable(req, res, next) {
    try {
        const user = await loadUser(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (!user.twoFactorEnabled) return res.json({ enabled: false });

        if (user.password) {
            const ok = await bcrypt.compare(String(req.body?.password ?? ''), user.password);
            if (!ok) return res.status(400).json({ message: 'Your password is incorrect.' });
        }

        const used = await twoFactor.verifySecondFactor(user, req.body ?? {});
        if (!used) return res.status(400).json({ message: 'That code didn’t match.' });

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        user.twoFactorPendingSecret = undefined;
        user.twoFactorLastStep = undefined;
        user.twoFactorRecoveryCodes = undefined;
        await user.save();

        return res.json({ enabled: false });
    } catch (error) {
        return next(error);
    }
}

/** POST /api/2fa/recovery-codes { code }: replace all recovery codes. */
async function regenerateRecoveryCodes(req, res, next) {
    try {
        const user = await loadUser(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (!user.twoFactorEnabled) {
            return res.status(400).json({ message: 'Turn on two-factor authentication first.' });
        }

        // Authenticator code only: a recovery code shouldn't mint new ones.
        const used = await twoFactor.verifySecondFactor(user, { code: req.body?.code });
        if (!used) return res.status(400).json({ message: 'That code didn’t match.' });

        const { codes, hashes } = await twoFactor.generateRecoveryCodes();
        user.twoFactorRecoveryCodes = hashes;
        await user.save();

        return res.json({ recoveryCodes: codes });
    } catch (error) {
        return next(error);
    }
}

module.exports = { status, setup, enable, disable, regenerateRecoveryCodes };
