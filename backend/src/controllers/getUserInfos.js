const UserSchema = require('../models/Schemas/User');
const GroupSchema = require('../models/Schemas/Group');
const ExpenseSchema = require('../models/Schemas/Expenses');
const calculateAllExpenses = require('./calculateAllExpenses');
const getFriendsCount = require('./getFriendsCount');

async function getUserInfos(req, res, next) {
   const userId = req.session.userId;
   const currentUser = await UserSchema.findById(userId);
   const Groups = await GroupSchema.find({ "members.userId": userId });
   const Expenses = await ExpenseSchema.find({ participants: userId });
   const TotalExpenses = await calculateAllExpenses(userId);
   const FriendsCount = await getFriendsCount(userId);
   // console.log(TotalExpenses);
   // console.log("heres the expenses number : ", Expenses.length);
   // console.log(Groups.length);
   const formattedDate = new Date(currentUser.joinedAt).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
   });
   return res.json({
      user: {
         id: currentUser._id,
         name: currentUser.displayName || currentUser.username,
         email: currentUser.email,
         joinedAt: formattedDate,
         totalExpenses: TotalExpenses,
         friendsCount: FriendsCount,
         numberOfGroups: Groups.length,
         numberOfExpenses: Expenses.length,
      }
   });
}

module.exports = getUserInfos;