const crypto = require('crypto');
const transporter = require('../config/mailer');
const { FRONTEND_URL } = require('../config/urls');

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Only this hash is stored, so read access to the database is not enough to
// verify someone else's account.
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function createVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    return {
        token,
        hash: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
    };
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function sendVerificationEmail(user, token) {
    // The link opens a frontend page that POSTs the token. A plain GET would
    // let mail link scanners use up the token before the user clicks.
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    return transporter.sendMail({
        from: `"Splitify" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: 'Verify your email address',
        html: `
            <h2>Welcome, ${escapeHtml(user.username)}!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `,
    });
}

// Signup and resend answer without waiting on SMTP. A failure is logged, and
// the user can ask for a new link from the verify-email page.
function sendVerificationEmailInBackground(user, token) {
    sendVerificationEmail(user, token).catch((error) => {
        console.error('Failed to send verification email:', error.message);
    });
}

module.exports = {
    hashToken,
    createVerificationToken,
    sendVerificationEmailInBackground,
};
