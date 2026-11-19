const mongoose = require("mongoose");
const User = require("../models/Schemas/User");
const Group = require("../models/Schemas/Group");
const Expense = require("../models/Schemas/Expenses");

function isValidId(id) {
    return mongoose.isValidObjectId(id);
}

async function getUsers(req, res, next) {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ joinedAt: -1 });

        return res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        return next(error);
    }
}

async function getUserById(req, res, next) {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return next(error);
    }
}

async function suspendUser(req, res, next) {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (id === req.user.id) {
            return res.status(400).json({
                message: "You cannot suspend your own account"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                message: "You cannot suspend an admin account"
            });
        }

        user.status = "suspended";
        await user.save();

        return res.status(200).json({
            message: "User suspended successfully",
            user: {
                id: user._id,
                username: user.username,
                status: user.status
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function reactivateUser(req, res, next) {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                message: "This action is only for regular users"
            });
        }

        user.status = "active";
        await user.save();

        return res.status(200).json({
            message: "User reactivated successfully",
            user: {
                id: user._id,
                username: user.username,
                status: user.status
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function getGroups(req, res, next) {
    try {
        const groups = await Group.find()
            .populate("createdBy", "username email")
            .populate("members.userId", "username email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: groups.length,
            groups
        });
    } catch (error) {
        return next(error);
    }
}

async function getGroupById(req, res, next) {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        const group = await Group.findById(id)
            .populate("createdBy", "username email")
            .populate("members.userId", "username email")
            .populate("conversationId");

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        return res.status(200).json({ group });
    } catch (error) {
        return next(error);
    }
}

async function getStatistics(req, res, next) {
    try {
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            totalAdmins,
            totalGroups,
            totalExpenses
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({
                role: "user",
                status: "active"
            }),
            User.countDocuments({
                role: "user",
                status: "suspended"
            }),
            User.countDocuments({ role: "admin" }),
            Group.countDocuments(),
            Expense.countDocuments()
        ]);

        return res.status(200).json({
            users: {
                total: totalUsers,
                active: activeUsers,
                suspended: suspendedUsers,
                admins: totalAdmins
            },
            groups: {
                total: totalGroups
            },
            expenses: {
                total: totalExpenses
            }
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getUsers,
    getUserById,
    suspendUser,
    reactivateUser,
    getGroups,
    getGroupById,
    getStatistics
};
