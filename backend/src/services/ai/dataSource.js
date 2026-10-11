const User = require('../../modles/Schemas/User');
const Group = require('../../modles/Schemas/Group');
const Expense = require('../../modles/Schemas/Expenses');
const Settlement = require('../../modles/Schemas/Settlement');


// load data for only one group
async function loadGroupDocuments(userId, groupId) {
  const group = await Group.findOne({
    _id: groupId,
    $or: [
      { owner: userId },
      { members: userId }
    ]
  })
    .populate('members', 'username')
    .populate('owner', 'username')
    .lean();

  if (!group) {
    return null;
  }

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

  const totalAgg = await Expense.aggregate([
    { $match: { group: group._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  let total = 0;
  if (totalAgg.length > 0) {
    total = totalAgg[0].total;
  }

  const docs = [];

  //group information 
  const memberNames = [];
  for (let i = 0; i < group.members.length; i++) {
    if (group.members[i] && group.members[i].username) {
      memberNames.push(group.members[i].username);
    }
  }

  let ownerName = 'مجهول';
  if (group.owner && group.owner.username) {
    ownerName = group.owner.username;
  }

  docs.push(
    'المجموعة الحالية اسمها "' + group.groupName + '" ' +
    'وصاحبها هو ' + ownerName + '، ' +
    'وتضم الأعضاء: ' + memberNames.join('، ') + '. ' +
    'إجمالي مصاريف هذه المجموعة: ' + total + ' درهم.'
  );

  // Expenses
  for (let i = 0; i < expenses.length; i++) {
    const e = expenses[i];

    let payer = 'مجهول';
    if (e.payer) {
      payer = e.payer.username;
    }

    const parts = [];
    if (e.participants) {
      for (let j = 0; j < e.participants.length; j++) {
        if (e.participants[j] && e.participants[j].username) {
          parts.push(e.participants[j].username);
        }
      }
    }

    let description = 'بدون وصف';
    if (e.description) {
      description = e.description;
    }

    docs.push(
      'مصروف بعنوان "' + description + '" ' +
      'بمبلغ ' + e.amount + ' درهم ' +
      'دفعه ' + payer + ' ' +
      'بتاريخ ' + formatDate(e.date) + ' ' +
      'وتم تقسيمه بين: ' + parts.join('، ') + '.'
    );
  }

  // settlements
  for (let i = 0; i < settlements.length; i++) {
    const s = settlements[i];

    let from = 'مجهول';
    if (s.fromUser) {
      from = s.fromUser.username;
    }

    let to = 'مجهول';
    if (s.toUser) {
      to = s.toUser.username;
    }

    docs.push(
      from + ' دفع لـ ' + to + ' بمبلغ ' + s.amount + ' درهم.'
    );
  }

  return {
    groupName: group.groupName,
    docs: docs
  };
}

// Load user information 
async function loadUserContext(userId, groupId) {
  const user = await User.findById(userId, 'username email').lean();

  if (!user) {
    return null;
  }

  let currentGroup = null;
  let userRole = 'member';

  if (groupId) {
    currentGroup = await Group.findOne({
      _id: groupId,
      $or: [
        { owner: userId },
        { members: userId }
      ]
    })
      .populate('owner', 'username')
      .populate('members', 'username')
      .lean();

    if (currentGroup && currentGroup.owner) {
      if (currentGroup.owner._id.toString() === userId.toString()) {
        userRole = 'owner';
      }
    }
  }

  return {
    username: user.username,
    email: user.email,
    role: userRole,
    currentGroup: currentGroup
  };
}

// Helpers
function formatDate(date) {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// Exports
module.exports = {
  loadGroupDocuments,
  loadUserContext
};