const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const Group = require('../models/Schemas/Group');
const printLogsDate = require('../utils/printLogs');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
    printLogsDate(`User with Id ${req.session.userId} opened the group creation page at : `);
    return res.render('CreateGroup');
});

router.post('/', requireAuth, async (req, res) => {
    const { groupName, groupDesc = '' } = req.body;
    if (!groupName || !groupName.trim()) {
        return res.status(400).send('A group name is required.');
    }

    try {
        await Group.create({
            name: groupName.trim(),
            description: groupDesc.trim(),
            createdBy: req.session.userId,
            members: [{ userId: req.session.userId, role: 'owner' }],
        });
        printLogsDate(`User with Id ${req.session.userId} created a group at : `);
        return res.redirect('/my-groups');
    } catch (error) {
        console.error('Error while creating a group:', error);
        return res.status(500).send('Unable to create the group.');
    }
});

module.exports = router;
