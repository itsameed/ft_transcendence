function cookieAuth(req, res, next) {
    if (!req.cookies.has_visited)
    {
        console.log("user has no cookies");
        res.cookie('has_visited', "true", {maxAge: 365 * 24 * 60 * 60 * 1000});
        res.render(`signup`);
    }
    next();
}

module.exports = cookieAuth;