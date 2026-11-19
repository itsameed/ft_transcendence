function cookieAuth(req, res, next) {
    if (!req.cookies.has_visited)
    {
        res.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
    }
    next();
}

module.exports = cookieAuth;