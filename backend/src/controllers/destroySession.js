async function destroySession(req, res, next) {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.status(500).sne ('Error Logging out');
        }
        res.clearCookie('connect.sid');

        res.json({ message: 'Logged out successfully.' });
    })
    next();
}

module.exports = destroySession;