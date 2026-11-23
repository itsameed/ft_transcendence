const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many requests. Please try again later.'
    },
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,

    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many failed login attempts. Try again in 15 minutes.'
    },
});

// A 6-digit code has a million values; keep guessing far out of reach.
const twoFactorLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many verification attempts. Try again in 15 minutes.'
    },
});

// Every request sends an email from our account, so keep this tight.
const verificationEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many verification emails requested. Try again in 15 minutes.'
    },
});

module.exports = { loginLimiter, generalLimiter, twoFactorLimiter, verificationEmailLimiter };
