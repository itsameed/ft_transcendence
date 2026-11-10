const User = require('../../models/Schemas/User');
const Group = require('../../models/Schemas/Group');
const Expense = require('../../models/Schemas/Expenses');
const Settlement = require('../../models/Schemas/Settlement');

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

async function loadGroupDocuments(userId, groupId) {
  const userData = await User.findById(userId, 'username email').lean();
  if (!userData) return null;

  const groupData = await Group.findOne({
    _id: groupId,
    $or: [
      { createdBy: userId },
      { 'members.userId': userId }
    ]
  })
    .populate('members.userId', 'username')
    .populate('createdBy', 'username')
    .lean();

  if (!groupData) return null;

  const expenses = await Expense.find({ group: groupId })
    .sort({ date: -1 })
    .limit(200)
    .populate('payer', 'username')
    .populate('participants', 'username')
    .lean();

  const settlements = await Settlement.find({ group: groupId })
    .populate('fromUser', 'username')
    .populate('toUser', 'username')
    .lean();

  const docs = [];

  let ownerName = 'Unknown';
  if (groupData.createdBy && groupData.createdBy.username) {
    ownerName = groupData.createdBy.username;
  }

  let userRole = 'member';
  if (groupData.createdBy && groupData.createdBy._id &&
      groupData.createdBy._id.toString() === userId.toString()) {
    userRole = 'owner';
  }

  const memberNames = [];
  if (groupData.members) {
    for (let i = 0; i < groupData.members.length; i++) {
      const m = groupData.members[i];
      if (m && m.userId && m.userId.username) {
        memberNames.push(m.userId.username);
      }
    }
  }

  docs.push(
    'Current user: "' + userData.username + '" ' +
    '(email: ' + userData.email + '), ' +
    'role: ' + userRole + ', owner: ' + ownerName + '.'
  );

  docs.push(
    'Group "' + groupData.name + '" members: ' +
    memberNames.join(', ') + '. ' +
    'Owner: ' + ownerName + '.'
  );

  for (let i = 0; i < expenses.length; i++) {
    const e = expenses[i];

    let payerName = 'Unknown';
    if (e.payer && e.payer.username) payerName = e.payer.username;

    let description = 'No description';
    if (e.description) description = e.description;

    const participants = [];
    if (e.participants) {
      for (let j = 0; j < e.participants.length; j++) {
        if (e.participants[j] && e.participants[j].username) {
          participants.push(e.participants[j].username);
        }
      }
    }

    docs.push(
      'Expense "' + description + '": ' + e.amount + ' MAD was paid by ' +
      payerName + ' on ' + formatDate(e.date) + '. ' +
      'Shared between: ' + participants.join(', ') + '.'
    );
  }

  for (let i = 0; i < settlements.length; i++) {
    const s = settlements[i];

    let fromName = 'Unknown';
    let toName = 'Unknown';
    if (s.fromUser && s.fromUser.username) fromName = s.fromUser.username;
    if (s.toUser && s.toUser.username) toName = s.toUser.username;

    docs.push(
      'Settlement: ' + fromName + ' paid ' + toName + ' ' + s.amount + ' MAD.'
    );
  }

  return {
    groupName: groupData.name,
    docs: docs
  };
}

module.exports = {
  loadGroupDocuments
};