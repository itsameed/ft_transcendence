const express = require("express");
const { getUsers, getUsersByid, deleteUserByid, getEditByid, editUserByid, createUser } = require("../controllers/userController");

const router = express.Router();

router.post("/", createUser);

router.get("/", getUsers);

router.get('/:userid', getUsersByid);

router.post('/:userid/delete', deleteUserByid);

router.get('/:userid/edit', getEditByid);

router.post("/:userid/edit", editUserByid);

module.exports = router;