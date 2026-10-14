const User = require("../models/Schemas/User");

async function apiAuth(req, res, next) {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const user = await User.findById(req.session.userId)
            .select("_id username role status");

        if (!user) {
            req.session.destroy(() => { });
            return res.status(401).json({
                message: "User no longer exists"
            });
        }

        if (user.status === "suspended") {
            return res.status(403).json({
                message: "Your account is suspended"
            });
        }
        req.user = {
            id: user._id.toString(),
            username: user.username,
            role: user.role
        };

        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = apiAuth;