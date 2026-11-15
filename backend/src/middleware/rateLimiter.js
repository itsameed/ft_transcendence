const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, try again in 15 minutes',
});

module.exports = {loginLimiter, generalLimiter};