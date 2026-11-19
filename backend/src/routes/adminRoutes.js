const express = require("express");
const router = express.Router();

const apiAuth = require("../middleware/apiAuth");
const adminAuth = require("../middleware/adminAuth");

const {
    getUsers,
    getUserById,
    suspendUser,
    reactivateUser,
    getGroups,
    getGroupById,
    getStatistics
} = require("../controllers/adminController");

router.use(apiAuth, adminAuth);

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/reactivate", reactivateUser);
router.get("/groups", getGroups);
router.get("/groups/:id", getGroupById);
router.get("/statistics", getStatistics);

module.exports = router;
