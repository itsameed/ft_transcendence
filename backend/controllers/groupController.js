const mongoose = require("mongoose");
const Group = require("../models/Group");

const createGroup = async (req, res) => {
  try {
    const { name, createdBy } = req.body;

    // 1. Check required fields
    if (!name || !createdBy) {
      return res.status(400).json({
        message: "Name and createdBy are required"
      });
    }

    // 2. Check if user ID is valid
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    // 3. Create the group
    const group = await Group.create({
      name: name,
      createdBy: createdBy,
      members: [
        {
          userId: createdBy,
          role: "owner"
        }
      ]
    });

    // 4. Send response
    return res.status(201).json({
      message: "Group created successfully",
      group
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createGroup
};