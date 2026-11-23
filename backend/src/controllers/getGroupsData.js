const GroupSchema = require("../models/Schemas/Group");
const ExpenseSchema = require('../models/Schemas/Expenses');


function returnGroups(group) {
    return {
        groupName: group.name,
        members: group.members.length,
        description: group.description,
    }
}

async function getGroupsData(req, res, next)
{
    try {
    const userId = req.session.userId;
    let GroupsInfos = [];
    const Groups = await GroupSchema.find({'members.userId': userId}).populate('members');
    for (let group of Groups) {
        GroupsInfos.push(returnGroups(group));
    }
    return res.render(GroupsInfos);
    } catch (error) {
        console.error("Error getting groups data:", error);
        throw error;
    }
}

module.exports = getGroupsData;
