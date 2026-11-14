
const crypto = require('crypto');
const User = require('../../models/Schemas/User');
const Group = require('../../models/Schemas/Group');
const Expense = require('../../models/Schemas/Expenses');
const Settlement = require('../../models/Schemas/Settlement');

<<<<<<< Updated upstream

async function loadGroupDocuments(userId, groupId) {
  const group = await Group.findOne({
    _id: groupId,
    $or: [
      { createdBy: userId },
      { 'members.userId': userId }
    ]
  })
    .populate('members.userId', 'username')
    .populate('createdBy', 'username')
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

  // ----- Members -----
  const memberNames = [];
  if (group.members) {
    for (let i = 0; i < group.members.length; i++) {
      const m = group.members[i];
      if (m && m.userId && m.userId.username) {
        memberNames.push(m.userId.username);
      }
    }
  }

  // ----- Owner name -----
  let ownerName = 'مجهول';
  if (group.createdBy && group.createdBy.username) {
    ownerName = group.createdBy.username;
  }

  // ----- Group doc -----
  docs.push(
    'المجموعة الحالية اسمها "' + group.name + '" ' +
    'وصاحبها هو ' + ownerName + '، ' +
    'وتضم الأعضاء: ' + memberNames.join('، ') + '. ' +
    'إجمالي مصاريف هذه المجموعة: ' + total + ' درهم.'
  );

  // ----- Expenses -----
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
=======
const cache = new Map();

function formatDate(date) {
    if (!date) return '';

    return new Date(date).toISOString().slice(0, 10);
}

function getFingerprint(docs) {
    return crypto.createHash('sha256')
        .update(docs.join('\n---\n'))
        .digest('hex');
}

async function getRevision(userId, groupId) {
    const user = await User.findById(userId)
        .select('username email updatedAt')
        .lean();

    if (!user) return null;

    const group = await Group.findOne({
        _id: groupId,
        $or: [
            { createdBy: userId },
            { 'members.userId': userId }
        ]
    })
        .select('name createdBy members updatedAt')
        .lean();

    if (!group) return null;

    const expenseStats = await Expense.aggregate([
        { $match: { group: group._id } },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                total: { $sum: '$amount' },
                updatedAt: { $max: '$updatedAt' }
            }
        }
    ]);

    const settlementStats = await Settlement.aggregate([
        { $match: { group: group._id } },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                updatedAt: { $max: '$updatedAt' }
            }
        }
    ]);

    const revision = JSON.stringify({
        user: user.updatedAt,
        group: group.updatedAt,
        memberCount: group.members.length,
        expenses: expenseStats[0] || {},
        settlements: settlementStats[0] || {}
    });

    return {
        user,
        group,
        revision
    };
}

async function loadGroupDocuments(userId, groupId) {
    const snapshot = await getRevision(userId, groupId);

    if (!snapshot) return null;

    const userData = snapshot.user;

    const groupData = await Group.findById(snapshot.group._id)
        .populate('members.userId', 'username')
        .populate('createdBy', 'username')
        .lean();

    if (!groupData) return null;

    const expenses = await Expense.find({
        group: groupData._id
    })
        .sort({ date: -1 })
        .limit(200)
        .populate('payer', 'username')
        .populate('participants', 'username')
        .lean();

    const settlements = await Settlement.find({
        group: groupData._id
    })
        .populate('fromUser', 'username')
        .populate('toUser', 'username')
        .lean();

    const stats = await Expense.aggregate([
        { $match: { group: groupData._id } },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    const total = stats.length ? stats[0].total : 0;
    const expenseCount = stats.length ? stats[0].count : 0;

    const memberCount = groupData.members.length;
    const settlementCount = await Settlement.countDocuments({
        group: groupData._id
    });

    const ownerName = groupData.createdBy?.username || 'Unknown';

    const userRole =
        groupData.createdBy?._id.toString() === userId.toString()
            ? 'owner'
            : 'member';

    const memberNames = [];

    for (let i = 0; i < groupData.members.length; i++) {
        const member = groupData.members[i];

        if (member.userId?.username) {
            memberNames.push(member.userId.username);
>>>>>>> Stashed changes
        }
    }

<<<<<<< Updated upstream
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
=======
    const statistics = {
        memberCount,
        expenseCount,
        settlementCount,
        total
    };

    const docs = [];

    docs.push(
        'Current user: "' + userData.username +
        '" (email: ' + userData.email +
        '), role: ' + userRole +
        ', owner: ' + ownerName + '.'
>>>>>>> Stashed changes
    );

<<<<<<< Updated upstream
  // ----- Settlements -----
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

    docs.push(from + ' دفع لـ ' + to + ' بمبلغ ' + s.amount + ' درهم.');
  }

  return {
    groupName: group.name,
    docs: docs
  };
=======
    docs.push(
        'AUTHORITATIVE GROUP STATISTICS for "' +
        groupData.name + '": ' +
        'Total members including owner: ' + memberCount +
        '. Total expenses recorded: ' + expenseCount +
        '. Total settlements recorded: ' + settlementCount +
        '. Total expense amount: ' + total + ' MAD.'
    );

    docs.push(
        'Group "' + groupData.name +
        '" members: ' + memberNames.join(', ') +
        '. Owner: ' + ownerName + '.'
    );

    docs.push(
        'GROUP TOTAL: ' + total +
        ' MAD across ' + expenseCount + ' expenses.'
    );

    for (let i = 0; i < expenses.length; i++) {
        const e = expenses[i];

        const participants = [];

        for (let j = 0; j < e.participants.length; j++) {
            if (e.participants[j]?.username) {
                participants.push(e.participants[j].username);
            }
        }

        docs.push(
            'Expense "' + (e.description || 'No description') +
            '": ' + e.amount +
            ' MAD was paid by ' +
            (e.payer?.username || 'Unknown') +
            ' on ' + formatDate(e.date) +
            '. Shared between: ' + participants.join(', ') + '.'
        );
    }

    for (let i = 0; i < settlements.length; i++) {
        const s = settlements[i];

        docs.push(
            'Settlement: ' +
            (s.fromUser?.username || 'Unknown') +
            ' paid ' +
            (s.toUser?.username || 'Unknown') +
            ' ' + s.amount + ' MAD.'
        );
    }

    const fingerprint = getFingerprint([
        ...docs,
        JSON.stringify(statistics)
    ]);

    return {
        docs,
        groupName: groupData.name,
        fingerprint,
        total,
        expenseCount,
        settlementCount,
        memberCount,
        memberNames,
        statistics
    };
}

async function loadGroupDocumentsCached(userId, groupId) {
    const key = userId.toString() + ':' + groupId.toString();

    const snapshot = await getRevision(userId, groupId);

    if (!snapshot) {
        cache.delete(key);
        return null;
    }

    const cached = cache.get(key);

    if (cached && cached.revision === snapshot.revision) {
        return cached.data;
    }

    const data = await loadGroupDocuments(userId, groupId);

    if (!data) return null;

    cache.set(key, {
        revision: snapshot.revision,
        data
    });

    console.log(
        '[data] CACHE',
        cached ? 'UPDATED' : 'CREATED'
    );

    return data;
>>>>>>> Stashed changes
}


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
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    })
      .populate('createdBy', 'username')
      .populate('members.userId', 'username')
      .lean();

    if (currentGroup && currentGroup.createdBy) {
      if (currentGroup.createdBy._id.toString() === userId.toString()) {
        userRole = 'owner';
      }
    }
  }

  // Map new schema → what chat.js expects
  let mapped = null;
  if (currentGroup) {
    const memberUsers = [];
    if (currentGroup.members) {
      for (let i = 0; i < currentGroup.members.length; i++) {
        const m = currentGroup.members[i];
        if (m && m.userId) {
          memberUsers.push(m.userId);
        }
      }
    }

    mapped = {
      _id: currentGroup._id,
      groupName: currentGroup.name,
      owner: currentGroup.createdBy,
      members: memberUsers
    };
  }

  return {
    username: user.username,
    email: user.email,
    role: userRole,
    currentGroup: mapped
  };
}

// ============================================================
// Helpers
// ============================================================
function formatDate(date) {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// ============================================================
// Exports
// ============================================================
module.exports = {
<<<<<<< Updated upstream
  loadGroupDocuments,
  loadUserContext
};
=======
    loadGroupDocuments,
    loadGroupDocumentsCached
};
>>>>>>> Stashed changes
