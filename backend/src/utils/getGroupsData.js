const GroupSchema = require("../models/Schemas/Group");
const ExpenseSchema = require('../models/Schemas/Expenses');

function getGroupsData(userId)
{
    const Groups = GroupSchema.find({members: userId});
    // const Expenses = 
    // for (let)

}

module.exports = getGroupsData;