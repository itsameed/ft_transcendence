import express from 'express';
import Auth from '../../controllers/middleware.js';

const CreateGroup = express.Router();

CreateGroup.post(`/`, Auth, async (req, res) => {
    if (!req.body)
        return res.status(400).send("Error while receiving body");
    const newGroup = new GroupSchema ({
        owner: req.session.userId,
        groupName: req.groupName,
        description: req.description,
        members: [req.session.userId],
    });
    try {
        await newGroup.save();
    } catch (error) {
        console.log(error);
    }
    process.stdout.write("user with id : ");
    process.stdout.write(req.session.userId);
    process.stdout.write(" created a group at ");
    const date = new Date();
    const currentDate = date.toLocaleString();
    console.log(currentDate);
});

export default CreateGroup;