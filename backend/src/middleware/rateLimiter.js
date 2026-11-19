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

module.exports = { loginLimiter, generalLimiter };