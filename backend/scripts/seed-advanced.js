/**
 * Advanced dev seed for Splitify: a large, realistic dataset.
 *
 *   node scripts/seed-advanced.js            wipe the database, then seed
 *   node scripts/seed-advanced.js --no-wipe  seed on top (skips if users exist)
 *
 * Every account is email-verified and has a complete profile (bio, gender,
 * avatar, join date). Everyone shares one password so you can log in as anyone.
 * The data is generated from a fixed PRNG seed, so every run gives the same set.
 *
 * What gets created:
 *   - 1 admin + 24 users, all verified, all with full profiles
 *   - a friendship graph (accepted, pending both ways, rejected)
 *   - 10 groups of different kinds, each with its own chat
 *   - ~150 expenses (equal and custom splits) spread over months
 *   - settlements computed from the real balances (accepted, pending, rejected)
 *   - group chat history, direct conversations, notifications, invitations
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../src/models/Schemas/User');
const Friendship = require('../src/models/Schemas/Friendship');
const Group = require('../src/models/Schemas/Group');
const Conversation = require('../src/models/Schemas/Conversation');
const Message = require('../src/models/Schemas/Message');
const Expense = require('../src/models/Schemas/Expenses');
const Settlement = require('../src/models/Schemas/Settlement');
const Notification = require('../src/models/Schemas/Notification');
const GroupInvitation = require('../src/models/Schemas/GroupInvitation');
const { DEFAULT_AVATARS, defaultAvatarPath } = require('../src/config/avatars');
const { computeGroupBalances, round2 } = require('../src/services/balances');

const PASSWORD = 'Password123!';
const ADMIN = { username: 'admin', email: 'admin@splitify.test', password: 'admin' };

// ---------------------------------------------------------------- helpers

/** Deterministic PRNG (mulberry32) so the dataset is reproducible. */
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = makeRng(42);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
function sample(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const daysAgo = (n, hour = 12, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
};
const avatarFor = (i) => defaultAvatarPath(DEFAULT_AVATARS[i % DEFAULT_AVATARS.length]);
const pairKey = (a, b) => [String(a), String(b)].sort().join(':');

/** Splits `amount` into random positive cent shares that sum exactly to it. */
function randomSplit(amount, count) {
  const cents = Math.round(amount * 100);
  const weights = Array.from({ length: count }, () => 0.5 + rand());
  const total = weights.reduce((s, w) => s + w, 0);
  const shares = weights.map((w) => Math.floor((w / total) * cents));
  shares[0] += cents - shares.reduce((s, c) => s + c, 0);
  return shares.map((c) => c / 100);
}

// ---------------------------------------------------------------- people

const PEOPLE = [
  { username: 'demo', gender: 'female', bio: 'The account you log in with. Splits everything, forgets nothing.' },
  { username: 'yassine', gender: 'male', bio: 'Always up for a road trip. Drives, never navigates.' },
  { username: 'salma', gender: 'female', bio: 'Chief expense tracker. Spreadsheets are my love language.' },
  { username: 'omar', gender: 'male', bio: 'Pays first, asks later. Friday football captain.' },
  { username: 'hiba', gender: 'female', bio: 'Surf, sun, split. Based in Taghazout most weekends.' },
  { username: 'anas', gender: 'male', bio: 'Roommate, co-payer and part-time chef.' },
  { username: 'imane', gender: 'female', bio: 'New in town — send me a request!' },
  { username: 'mehdi', gender: 'male', bio: 'Football every Friday, padel every Sunday.' },
  { username: 'nadia', gender: 'female', bio: 'Keeps the receipts. Literally, all of them.' },
  { username: 'karim', gender: 'male', bio: 'Software engineer, coffee snob, hiking addict.' },
  { username: 'leila', gender: 'female', bio: 'Photographer. I will make you pose at every viewpoint.' },
  { username: 'hamza', gender: 'male', bio: 'Organises the trips nobody else wants to plan.' },
  { username: 'sara', gender: 'female', bio: 'Medical student on a strict budget. Equal splits only.' },
  { username: 'youssef', gender: 'male', bio: 'Concert tickets bought before the lineup is out.' },
  { username: 'kenza', gender: 'female', bio: 'Architect. Weekend markets and long dinners.' },
  { username: 'adam', gender: 'male', bio: 'Climber. Owes everyone for gas, pays it back in snacks.' },
  { username: 'rania', gender: 'female', bio: 'Event planner by day, event planner by night.' },
  { username: 'ilyas', gender: 'male', bio: 'Gamer, cook, reluctant early riser.' },
  { username: 'zineb', gender: 'female', bio: 'Yoga teacher. Hosts the retreat every spring.' },
  { username: 'reda', gender: 'male', bio: 'Finance guy. Yes, I checked the math twice.' },
  { username: 'meryem', gender: 'female', bio: 'Bookworm and board-game night host.' },
  { username: 'soufiane', gender: 'male', bio: 'Skis badly, enjoys it anyway.' },
  { username: 'aya', gender: 'female', bio: 'Design student. Will trade sketches for coffee.' },
  { username: 'bilal', gender: 'male', bio: 'Camping gear owner — borrow anything, return it clean.' },
].map((p) => ({ ...p, email: `${p.username}@splitify.test` }));

// ---------------------------------------------------------------- groups

const GROUPS = [
  {
    name: 'Chefchaouen Trip', kind: 'trip', emoji: '🏔️', owner: 'demo', createdDaysAgo: 45,
    members: ['demo', 'yassine', 'salma', 'hiba', 'leila'],
    description: 'Blue city long weekend — riad, hikes and too much mint tea.',
    expenses: [['Riad booking', 900, 1500], ['Group dinner', 300, 700], ['Taxi from Tangier', 250, 450], ['Breakfast', 120, 220], ['Akchour waterfall guide', 200, 350], ['Souvenirs', 80, 260], ['Fuel', 300, 500], ['Snacks for the road', 60, 140]],
    count: 16, chat: 'trip',
  },
  {
    name: 'Apartment 4B', kind: 'home', emoji: '🏠', owner: 'anas', createdDaysAgo: 180,
    members: ['anas', 'demo', 'omar'],
    description: 'Shared flat bills, groceries and the eternal cleaning schedule.',
    expenses: [['Rent share', 2400, 2400], ['Electricity', 180, 420], ['Water', 60, 140], ['Internet', 299, 299], ['Groceries', 150, 600], ['Cleaning supplies', 50, 150], ['New kettle', 180, 260], ['Gas bottle', 50, 60]],
    count: 28, chat: 'home',
  },
  {
    name: 'Friday Football', kind: 'sports', emoji: '⚽', owner: 'omar', createdDaysAgo: 120,
    members: ['omar', 'demo', 'mehdi', 'yassine', 'karim', 'ilyas', 'reda'],
    description: 'Weekly five-a-side. Losers buy the drinks.',
    expenses: [['Pitch rental', 350, 350], ['Drinks after the match', 90, 220], ['New ball', 250, 400], ['Bibs', 150, 200]],
    count: 18, chat: 'sports',
  },
  {
    name: 'Rooftop Dinner', kind: 'dinner', emoji: '🍽️', owner: 'salma', createdDaysAgo: 14,
    members: ['salma', 'demo', 'hiba', 'nadia', 'kenza'],
    description: 'Birthday dinner on the rooftop in Gueliz.',
    expenses: [['Dinner and drinks', 1200, 1600], ['Birthday cake', 220, 320], ['Flowers', 150, 250], ['Taxi home', 60, 120]],
    count: 4, chat: 'dinner',
  },
  {
    name: 'Atlas Ski Weekend', kind: 'skiing', emoji: '⛷️', owner: 'soufiane', createdDaysAgo: 75,
    members: ['soufiane', 'demo', 'karim', 'adam', 'meryem', 'hamza'],
    description: 'Oukaimeden — two days of snow and one day of recovery.',
    expenses: [['Chalet', 1800, 2600], ['Ski rental', 600, 1000], ['Lift passes', 500, 800], ['Tagine dinner', 250, 450], ['Fuel and tolls', 350, 550], ['Hot chocolate run', 60, 120]],
    count: 12, chat: 'trip',
  },
  {
    name: 'Mawazine Festival', kind: 'festival', emoji: '🎶', owner: 'youssef', createdDaysAgo: 60,
    members: ['youssef', 'demo', 'aya', 'rania', 'ilyas'],
    description: 'Three nights of concerts in Rabat.',
    expenses: [['Festival passes', 1200, 1800], ['Train tickets', 300, 500], ['Airbnb', 900, 1400], ['Street food', 100, 250], ['Merch', 150, 400]],
    count: 10, chat: 'festival',
  },
  {
    name: 'Desert Camping', kind: 'camping', emoji: '🏕️', owner: 'bilal', createdDaysAgo: 100,
    members: ['bilal', 'demo', 'hamza', 'leila', 'zineb', 'adam'],
    description: 'Merzouga under the stars. Bilal brings the tents.',
    expenses: [['Camel trek', 800, 1200], ['Camp fee', 600, 900], ['Car rental', 1100, 1500], ['Fuel', 400, 700], ['Water and supplies', 150, 300], ['Sandboarding', 200, 350]],
    count: 11, chat: 'trip',
  },
  {
    name: 'Spring Yoga Retreat', kind: 'retreat', emoji: '🧘', owner: 'zineb', createdDaysAgo: 30,
    members: ['zineb', 'sara', 'kenza', 'meryem', 'demo'],
    description: 'Four days of yoga, silence and very healthy food in Essaouira.',
    expenses: [['Retreat house', 2000, 3000], ['Organic groceries', 300, 600], ['Massage session', 400, 600], ['Bus tickets', 200, 300]],
    count: 8, chat: 'retreat',
  },
  {
    name: 'Board Game Nights', kind: 'event', emoji: '🎲', owner: 'meryem', createdDaysAgo: 150,
    members: ['meryem', 'reda', 'sara', 'aya', 'ilyas', 'karim'],
    description: 'Every other Wednesday. Snacks rotate, grudges persist.',
    expenses: [['Pizza', 150, 300], ['New board game', 300, 600], ['Snacks and soda', 60, 150], ['Card sleeves', 80, 120]],
    count: 14, chat: 'event',
  },
  {
    name: 'Office Gift Pool', kind: 'other', emoji: '🎁', owner: 'rania', createdDaysAgo: 20,
    members: ['rania', 'nadia', 'reda', 'youssef', 'hamza', 'aya', 'sara'],
    description: 'Farewell gift and party for our manager.',
    expenses: [['Farewell gift', 1500, 2000], ['Cake', 250, 350], ['Decorations', 100, 200], ['Card', 40, 60]],
    count: 4, chat: 'event',
  },
];

const CHAT_LINES = {
  trip: ['Who is bringing the speaker?', 'I booked the place, adding it now.', 'Fuel is on me this time.', 'Can we leave at 7 instead of 6?', 'Photos are in the shared album!', 'That view was unreal.', 'Splitify says I owe you, sending tonight.', 'Next trip already? I am in.', 'Do not forget your jackets, it gets cold at night.', 'I added the dinner, check the split.'],
  home: ['Rent is paid, added it.', 'We are out of olive oil again.', 'Who left the lights on all day?', 'Internet bill is in.', 'I did the groceries, receipt attached.', 'Can someone take the trash out?', 'Landlord is coming Saturday.', 'Electricity was crazy this month.'],
  sports: ['Pitch booked for 9pm.', 'Who is in this Friday?', 'We need one more player.', 'Great match yesterday!', 'Drinks are on the losers 😄', 'I added the pitch rental.', 'Bring the bibs please.', 'Same time next week?'],
  dinner: ['Table booked for 8:30.', 'Happy birthday Salma! 🎉', 'Cake was perfect.', 'I added the dinner, it is split equally.', 'Who is ordering the taxi?', 'Best night in ages.'],
  festival: ['Lineup just dropped!', 'Passes bought for everyone.', 'Meet at the main stage at 9?', 'Train leaves at 15:40.', 'My phone is dead, find me by the food trucks.', 'Adding the Airbnb now.'],
  retreat: ['Remember: phones off after 9pm.', 'Morning session starts at 6:30.', 'Groceries are in the fridge.', 'Massage slots are booked.', 'I feel ten years younger.'],
  event: ['Who is hosting this time?', 'I bought the new game, adding it.', 'Pizza is on its way.', 'Rematch next week.', 'Gift is ordered!', 'Can everyone chip in by Friday?', 'Snacks covered.'],
};

const DIRECT_LINES = [
  'Hey! Did you see the new expense?', 'Yes, I will settle up tonight.', 'Thanks for covering me last time.', 'No worries at all.',
  'Are you coming on Friday?', 'Wouldn\'t miss it.', 'Can you add me to the trip group?', 'Done, check your invitations.',
  'Sent you the money.', 'Got it, thanks!', 'Lunch tomorrow?', 'Sure, 1pm works.',
];

// ---------------------------------------------------------------- database

async function wipeDatabase() {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const report = [];
  for (const { name } of collections) {
    const { deletedCount } = await db.collection(name).deleteMany({});
    if (deletedCount > 0) report.push(`${deletedCount} ${name}`);
  }
  return report;
}

async function createUsers() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users = {};

  users.admin = await User.create({
    username: ADMIN.username,
    email: ADMIN.email,
    password: await bcrypt.hash(ADMIN.password, 10),
    bio: 'Platform administrator. Keeps the lights on.',
    gender: 'male',
    avatar: avatarFor(0),
    isVerified: true,
    joinedAt: daysAgo(365),
    role: 'admin',
    status: 'active',
  });

  const docs = await User.insertMany(PEOPLE.map((person, index) => ({
    ...person,
    password: passwordHash,
    avatar: avatarFor(index),
    isVerified: true,
    joinedAt: daysAgo(240 - index * 7, randInt(8, 22), randInt(0, 59)),
    role: 'user',
    status: 'active',
  })));
  for (const doc of docs) users[doc.username] = doc;
  return users;
}

async function createFriendships(users) {
  const { demo } = users;
  const seen = new Set();
  const rows = [];
  const add = (a, b, status, days) => {
    const key = pairKey(a._id, b._id);
    if (a._id.equals(b._id) || seen.has(key)) return;
    seen.add(key);
    rows.push({ requester: a._id, receiver: b._id, status, createdAt: daysAgo(days), updatedAt: daysAgo(Math.max(0, days - 1)) });
  };

  // demo: a big friend list, plus requests in every state.
  for (const name of ['yassine', 'salma', 'omar', 'hiba', 'anas', 'mehdi', 'karim', 'leila', 'hamza', 'kenza', 'youssef', 'soufiane', 'bilal', 'zineb', 'adam', 'aya', 'meryem', 'rania']) {
    chance(0.5) ? add(demo, users[name], 'ACCEPTED', randInt(20, 200)) : add(users[name], demo, 'ACCEPTED', randInt(20, 200));
  }
  add(users.imane, demo, 'PENDING', 2);
  add(users.sara, demo, 'PENDING', 1);
  add(users.ilyas, demo, 'PENDING', 4);
  add(demo, users.nadia, 'PENDING', 3);
  add(demo, users.reda, 'PENDING', 6);

  // Everyone who shares a group becomes friends.
  for (const g of GROUPS) {
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        if (g.members[i] === 'demo' || g.members[j] === 'demo') continue;
        add(users[g.members[i]], users[g.members[j]], 'ACCEPTED', randInt(g.createdDaysAgo, g.createdDaysAgo + 60));
      }
    }
  }

  // Some random extra connections and noise.
  const others = PEOPLE.map((p) => users[p.username]).filter((u) => u.username !== 'demo');
  for (let i = 0; i < 25; i++) {
    const [a, b] = sample(others, 2);
    add(a, b, pick(['ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'PENDING', 'REJECTED']), randInt(1, 150));
  }

  return Friendship.insertMany(rows);
}

function buildExpenses(groupDoc, def, users) {
  const members = def.members.map((name) => users[name]);
  const rows = [];
  for (let i = 0; i < def.count; i++) {
    const [description, min, max] = def.expenses[i % def.expenses.length];
    const amount = round2(min === max ? min : min + rand() * (max - min));
    const payer = pick(members);
    // Mostly everyone; sometimes a subset that always includes the payer.
    let participants = members;
    if (members.length > 3 && chance(0.3)) {
      const rest = members.filter((m) => !m._id.equals(payer._id));
      participants = [payer, ...sample(rest, randInt(1, rest.length - 1))];
    }
    const spread = Math.max(1, def.createdDaysAgo - 1);
    const day = Math.round(def.createdDaysAgo - 1 - (i / Math.max(1, def.count - 1)) * (spread - 1));
    const row = {
      group: groupDoc._id,
      payer: payer._id,
      participants: participants.map((p) => p._id),
      amount,
      description,
      splitMethod: 'equal',
      date: daysAgo(Math.max(0, day), randInt(9, 22), randInt(0, 59)),
    };
    if (participants.length > 1 && chance(0.25)) {
      const shares = randomSplit(amount, participants.length);
      row.splitMethod = 'custom';
      row.customSplit = participants.map((p, idx) => ({ user: p._id, amount: shares[idx] }));
    }
    rows.push(row);
  }
  return rows;
}

/** Greedy debtor→creditor matching on real balances, so settlements are always valid. */
function buildSettlements(groupDoc, def, expenses, users) {
  const memberIds = def.members.map((name) => users[name]._id);
  const net = computeGroupBalances(expenses, [], memberIds);
  const debtors = Object.entries(net).filter(([, v]) => v < -1).map(([id, v]) => ({ id, amount: -v })).sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(net).filter(([, v]) => v > 1).map(([id, v]) => ({ id, amount: v })).sort((a, b) => b.amount - a.amount);

  const rows = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = round2(Math.min(debtors[d].amount, creditors[c].amount));
    // Leave some debt open so the dashboard has balances to show.
    if (chance(0.6)) {
      const portion = chance(0.5) ? amount : round2(amount * (0.3 + rand() * 0.5));
      const roll = rand();
      rows.push({
        group: groupDoc._id,
        fromUser: debtors[d].id,
        toUser: creditors[c].id,
        amount: portion,
        status: roll < 0.75 ? 'accepted' : roll < 0.92 ? 'pending' : 'rejected',
        date: daysAgo(randInt(0, Math.max(0, Math.min(def.createdDaysAgo - 2, 20))), randInt(9, 22)),
      });
    }
    debtors[d].amount -= amount;
    creditors[c].amount -= amount;
    if (debtors[d].amount < 1) d++;
    if (creditors[c].amount < 1) c++;
  }
  return rows;
}

function buildChat(conversationId, memberDocs, lines, startDaysAgo, count) {
  return Array.from({ length: count }, (_, i) => {
    const day = Math.round(startDaysAgo - (i / Math.max(1, count - 1)) * startDaysAgo);
    const at = daysAgo(Math.max(0, day), randInt(8, 23), randInt(0, 59));
    return { conversationId, senderId: pick(memberDocs)._id, content: pick(lines), createdAt: at, updatedAt: at };
  }).sort((a, b) => a.createdAt - b.createdAt);
}

async function createGroups(users) {
  const groups = [];
  const allExpenses = [];
  const allSettlements = [];
  const messages = [];

  for (const def of GROUPS) {
    const memberDocs = def.members.map((name) => users[name]);
    const conversation = await Conversation.create({ participants: memberDocs.map((m) => m._id) });
    const created = daysAgo(def.createdDaysAgo, 10);

    const group = await Group.create({
      name: def.name,
      kind: def.kind,
      emoji: def.emoji,
      createdBy: users[def.owner]._id,
      description: def.description,
      members: memberDocs.map((m) => ({
        userId: m._id,
        role: m.username === def.owner ? 'owner' : 'member',
        joinedAt: m.username === def.owner ? created : daysAgo(Math.max(0, def.createdDaysAgo - randInt(0, 2)), 14),
      })),
      conversationId: conversation._id,
      createdAt: created,
    });

    const expenses = await Expense.insertMany(buildExpenses(group, def, users));
    group.expenses = expenses.map((e) => e._id);
    await group.save();

    allExpenses.push(...expenses);
    allSettlements.push(...buildSettlements(group, def, expenses, users));
    messages.push(...buildChat(conversation._id, memberDocs, CHAT_LINES[def.chat], def.createdDaysAgo, randInt(8, 22)));
    groups.push(group);
  }

  const settlements = await Settlement.insertMany(allSettlements);
  return { groups, expenses: allExpenses, settlements, messages };
}

async function createDirectChats(users, messages) {
  const partners = ['yassine', 'salma', 'omar', 'hiba', 'karim', 'leila'];
  const conversations = [];
  for (const name of partners) {
    const pair = [users.demo, users[name]];
    const conversation = await Conversation.create({ participants: pair.map((u) => u._id) });
    conversations.push(conversation);
    messages.push(...buildChat(conversation._id, pair, DIRECT_LINES, randInt(3, 40), randInt(4, 12)));
  }
  // A few conversations that do not involve demo.
  for (const [a, b] of [['salma', 'nadia'], ['karim', 'reda'], ['zineb', 'sara']]) {
    const pair = [users[a], users[b]];
    const conversation = await Conversation.create({ participants: pair.map((u) => u._id) });
    conversations.push(conversation);
    messages.push(...buildChat(conversation._id, pair, DIRECT_LINES, randInt(3, 30), randInt(3, 8)));
  }
  return conversations;
}

async function createInvitations(users, groups) {
  const byName = Object.fromEntries(groups.map((g) => [g.name, g]));
  return GroupInvitation.insertMany([
    { groupId: byName['Rooftop Dinner']._id, invitedUserId: users.mehdi._id, invitedBy: users.salma._id, status: 'pending' },
    { groupId: byName['Board Game Nights']._id, invitedUserId: users.demo._id, invitedBy: users.meryem._id, status: 'pending' },
    { groupId: byName['Office Gift Pool']._id, invitedUserId: users.demo._id, invitedBy: users.rania._id, status: 'pending' },
    { groupId: byName['Friday Football']._id, invitedUserId: users.adam._id, invitedBy: users.omar._id, status: 'pending' },
    { groupId: byName['Desert Camping']._id, invitedUserId: users.imane._id, invitedBy: users.bilal._id, status: 'rejected' },
    { groupId: byName['Spring Yoga Retreat']._id, invitedUserId: users.demo._id, invitedBy: users.zineb._id, status: 'accepted' },
    { groupId: byName['Mawazine Festival']._id, invitedUserId: users.demo._id, invitedBy: users.youssef._id, status: 'accepted' },
  ]);
}

async function createNotifications(users, groups, expenses, settlements) {
  const groupById = new Map(groups.map((g) => [String(g._id), g]));
  const userById = new Map(Object.values(users).map((u) => [String(u._id), u]));
  const rows = [];
  const add = (row, days) => rows.push({ ...row, createdAt: daysAgo(days, randInt(8, 22)), updatedAt: daysAgo(days) });

  // Expense notifications for every participant except the payer (recent ones only).
  for (const e of [...expenses].sort((a, b) => b.date - a.date).slice(0, 60)) {
    const payer = userById.get(String(e.payer));
    const group = groupById.get(String(e.group));
    for (const p of e.participants) {
      if (p.equals(e.payer)) continue;
      add({ userId: p, senderId: payer._id, type: 'EXPENSE_ADDED', title: 'New expense', message: `${payer.username} added "${e.description}" in ${group.name}`, relatedId: group._id, isRead: chance(0.6) }, randInt(0, 30));
    }
  }

  for (const s of settlements.filter((x) => x.status === 'accepted').slice(0, 25)) {
    const from = userById.get(String(s.fromUser));
    add({ userId: s.toUser, senderId: s.fromUser, type: 'PAYMENT_RECEIVED', title: 'Payment received', message: `${from.username} paid you ${s.amount} MAD`, relatedId: s.group, isRead: chance(0.5) }, randInt(0, 20));
  }

  const g = Object.fromEntries(groups.map((x) => [x.name, x]));
  const { demo } = users;
  add({ userId: demo._id, senderId: users.imane._id, type: 'FRIEND_REQUEST', title: 'Friend request', message: 'imane sent you a friend request', relatedId: users.imane._id }, 2);
  add({ userId: demo._id, senderId: users.sara._id, type: 'FRIEND_REQUEST', title: 'Friend request', message: 'sara sent you a friend request', relatedId: users.sara._id }, 1);
  add({ userId: demo._id, senderId: users.ilyas._id, type: 'FRIEND_REQUEST', title: 'Friend request', message: 'ilyas sent you a friend request', relatedId: users.ilyas._id }, 4);
  add({ userId: demo._id, senderId: users.meryem._id, type: 'GROUP_INVITATION', title: 'Group invitation', message: 'meryem invited you to Board Game Nights', relatedId: g['Board Game Nights']._id }, 1);
  add({ userId: demo._id, senderId: users.rania._id, type: 'GROUP_INVITATION', title: 'Group invitation', message: 'rania invited you to Office Gift Pool', relatedId: g['Office Gift Pool']._id }, 0);
  add({ userId: demo._id, senderId: users.omar._id, type: 'PAYMENT_REMINDER', title: 'Payment reminder', message: 'omar reminded you about the pitch rental', relatedId: g['Friday Football']._id }, 1);
  add({ userId: demo._id, senderId: users.anas._id, type: 'RECURRING_EXPENSE', title: 'Recurring expense', message: 'Rent share is due in Apartment 4B', relatedId: g['Apartment 4B']._id }, 3);
  add({ userId: demo._id, senderId: users.yassine._id, type: 'CHAT_MESSAGE', title: 'New message', message: 'yassine: Are you coming on Friday?', relatedId: g['Chefchaouen Trip'].conversationId }, 0);
  add({ userId: demo._id, senderId: users.soufiane._id, type: 'GROUP_UPDATED', title: 'Group updated', message: 'soufiane updated Atlas Ski Weekend', relatedId: g['Atlas Ski Weekend']._id, isRead: true }, 10);
  add({ userId: demo._id, senderId: users.bilal._id, type: 'TRIP_INVITATION', title: 'Trip invitation', message: 'bilal is planning another desert trip', relatedId: g['Desert Camping']._id, isRead: true }, 15);
  add({ userId: users.omar._id, senderId: users.reda._id, type: 'GROUP_MEMBER_LEFT', title: 'Member left', message: 'A member left Friday Football', relatedId: g['Friday Football']._id, isRead: true }, 25);
  add({ userId: users.imane._id, senderId: users.hamza._id, type: 'GROUP_REMOVED', title: 'Removed from group', message: 'You were removed from Desert Camping', relatedId: g['Desert Camping']._id, isRead: true }, 40);

  return Notification.insertMany(rows);
}

async function seed() {
  const users = await createUsers();
  const friendships = await createFriendships(users);
  const { groups, expenses, settlements, messages } = await createGroups(users);
  const directs = await createDirectChats(users, messages);
  await Message.insertMany(messages);
  const invitations = await createInvitations(users, groups);
  const notifications = await createNotifications(users, groups, expenses, settlements);

  return { users: Object.values(users), friendships, groups, expenses, settlements, messages, directs, invitations, notifications };
}

async function main() {
  const noWipe = process.argv.includes('--no-wipe');

  await mongoose.connect(process.env.MONGO_URL);
  console.log(`Connected to ${mongoose.connection.name}`);

  if (noWipe && (await User.countDocuments()) > 0) {
    console.log('Users already exist and --no-wipe was passed. Nothing to do.');
    return;
  }
  if (!noWipe) {
    const removed = await wipeDatabase();
    console.log(removed.length ? `Wiped: ${removed.join(', ')}` : 'Database was already empty.');
  }

  const r = await seed();

  console.log('\nAdvanced seed complete.');
  console.log(`  users:          ${r.users.length} (all email-verified, full profiles)`);
  console.log(`  friendships:    ${r.friendships.length}`);
  console.log(`  groups:         ${r.groups.length}`);
  console.log(`  expenses:       ${r.expenses.length}`);
  console.log(`  settlements:    ${r.settlements.length}`);
  console.log(`  conversations:  ${r.groups.length + r.directs.length} (${r.directs.length} direct)`);
  console.log(`  messages:       ${r.messages.length}`);
  console.log(`  invitations:    ${r.invitations.length}`);
  console.log(`  notifications:  ${r.notifications.length}`);
  console.log(`\nAdmin: ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`Everyone else, password: ${PASSWORD}  (main account: demo@splitify.test)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
