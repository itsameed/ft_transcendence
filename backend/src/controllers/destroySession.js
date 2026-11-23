async function destroySession(req, res, next) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error Logging out');
        }
        res.clearCookie('connect.sid');

        res.json({ message: 'Logged out successfully.' });
    });
}

module.exports = destroySession;
