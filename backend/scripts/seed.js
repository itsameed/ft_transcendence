/**
 * Dev-only seed data for frontend testing (Friends/Dashboard/Groups pages).
 *
 *   node scripts/seed.js           seed (idempotent: previous seed is replaced)
 *   node scripts/seed.js --clean   remove all seeded data
 *
 * Seeded users share the password below so you can log in as any of them.
 * The main test account is your existing user (hhz@hh.c, found by email) —
 * it is never deleted; only data carrying the seed marker is removed.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../src/models/Schemas/User');
const Friendship = require('../src/models/Schemas/Friendship');
const Group = require('../src/models/Schemas/Group');
const Conversation = require('../src/models/Schemas/Conversation');
const Expense = require('../src/models/Schemas/Expenses');
const Notification = require('../src/models/Schemas/Notification');

const MARKER = '[seed]';
const PASSWORD = 'Password123!';
const MAIN_EMAIL = 'hhz@hh.c';

const FAKE_USERS = [
  { username: 'yassine', displayName: 'Yassine El Amrani', email: 'yassine@tally.test', bio: 'Always up for a road trip' },
  { username: 'salma', displayName: 'Salma Bennani', email: 'salma@tally.test', bio: 'Chief expense tracker' },
  { username: 'omar', displayName: 'Omar Haddad', email: 'omar@tally.test', bio: 'Pays first, asks later' },
  { username: 'hiba', displayName: 'Hiba Mansouri', email: 'hiba@tally.test', bio: 'Surf, sun, split' },
  { username: 'anas', displayName: 'Anas El Fassi', email: 'anas@tally.test', bio: 'Roommate & co-payer' },
  { username: 'imane', displayName: 'Imane Chraibi', email: 'imane@tally.test', bio: 'New here — send me a request!' },
  { username: 'mehdi', displayName: 'Mehdi Alaoui', email: 'mehdi@tally.test', bio: 'Football every Friday' },
];

const daysAgo = (n, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d;
};

async function cleanSeed(fakeUserIds) {
  const groups = await Group.find({ description: new RegExp(MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).select('_id conversationId');
  const groupIds = groups.map((g) => g._id);
  const conversationIds = groups.map((g) => g.conversationId).filter(Boolean);

  await Expense.deleteMany({ group: { $in: groupIds } });
  await Group.deleteMany({ _id: { $in: groupIds } });
  await Conversation.deleteMany({ _id: { $in: conversationIds } });
  await Friendship.deleteMany({
    $or: [{ requester: { $in: fakeUserIds } }, { receiver: { $in: fakeUserIds } }],
  });
  await Notification.deleteMany({
    $or: [{ userId: { $in: fakeUserIds } }, { senderId: { $in: fakeUserIds } }, { message: new RegExp('seed') }],
  });
  await User.deleteMany({ _id: { $in: fakeUserIds } });
  return groupIds.length;
}

async function main() {
  const cleanOnly = process.argv.includes('--clean');
  await mongoose.connect(process.env.MONGO_URL);

  const existingFakes = await User.find({ email: { $in: FAKE_USERS.map((u) => u.email) } }).select('_id');
  const removed = await cleanSeed(existingFakes.map((u) => u._id));
  console.log(`Cleaned previous seed (${removed} groups, ${existingFakes.length} users).`);
  if (cleanOnly) return;

  const me = await User.findOne({ email: MAIN_EMAIL });
  if (!me) throw new Error(`Main user ${MAIN_EMAIL} not found — log in once first so the account exists.`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users = {};
  for (const fake of FAKE_USERS) {
    users[fake.username] = await User.create({ ...fake, password: passwordHash, joinedAt: daysAgo(90) });
  }
  const { yassine, salma, omar, hiba, anas, imane, mehdi } = users;

  // Friendships: 5 accepted, incoming pending (to test Accept/Reject),
  // outgoing pending (request sent), 1 rejected.
  const friendships = await Friendship.create([
    { requester: me._id, receiver: yassine._id, status: 'ACCEPTED' },
    { requester: salma._id, receiver: me._id, status: 'ACCEPTED' },
    { requester: me._id, receiver: omar._id, status: 'ACCEPTED' },
    { requester: hiba._id, receiver: me._id, status: 'ACCEPTED' },
    { requester: anas._id, receiver: me._id, status: 'ACCEPTED' },
    { requester: imane._id, receiver: me._id, status: 'PENDING' },
    { requester: mehdi._id, receiver: me._id, status: 'PENDING' },
    { requester: me._id, receiver: imane._id, status: 'PENDING' }, // duplicate-direction guard: skip if your API forbids
    { requester: me._id, receiver: mehdi._id, status: 'REJECTED' },
  ].filter((f, i) => i !== 7)); // keep only one pending direction per pair
  const pendingFromImane = friendships.find((f) => f.status === 'PENDING' && f.requester.equals(imane._id));

  // Groups with mixed members/roles; conversation participants mirror members.
  async function makeGroup({ name, kind, owner, members, description }) {
    const conversation = await Conversation.create({ participants: members.map((m) => m.userId) });
    const group = await Group.create({
      name,
      kind,
      createdBy: owner,
      description: `${MARKER} ${description}`,
      members,
      conversationId: conversation._id,
      createdAt: daysAgo(30),
    });
    return group;
  }
  const member = (u, role = 'member') => ({ userId: u._id, role, joinedAt: daysAgo(20) });

  const trip = await makeGroup({
    name: 'Chefchaouen Trip', kind: 'trip', owner: me._id,
    members: [member(me, 'owner'), member(yassine), member(salma), member(hiba)],
    description: 'Blue city weekend',
  });
  const home = await makeGroup({
    name: 'Apartment 4B', kind: 'home', owner: anas._id,
    members: [member(anas, 'owner'), member(me), member(omar)],
    description: 'Shared flat bills',
  });
  const foot = await makeGroup({
    name: 'Friday Football', kind: 'event', owner: me._id,
    members: [member(me, 'owner'), member(omar), member(mehdi), member(yassine)],
    description: 'Weekly five-a-side',
  });

  // Expenses: equal + custom splits so balances go both ways.
  const expenses = await Expense.create([
    { group: trip._id, payer: me._id, participants: [me._id, yassine._id, salma._id, hiba._id], amount: 1200, description: `${MARKER} Riad deposit`, splitMethod: 'equal', date: daysAgo(6) },
    { group: trip._id, payer: salma._id, participants: [me._id, yassine._id, salma._id, hiba._id], amount: 640, description: `${MARKER} Group dinner`, splitMethod: 'equal', date: daysAgo(5) },
    { group: trip._id, payer: yassine._id, participants: [me._id, yassine._id, salma._id], amount: 450, description: `${MARKER} Taxi & guide`, splitMethod: 'custom', customSplit: [{ user: me._id, amount: 200 }, { user: yassine._id, amount: 100 }, { user: salma._id, amount: 150 }], date: daysAgo(4) },
    { group: home._id, payer: anas._id, participants: [me._id, anas._id, omar._id], amount: 900, description: `${MARKER} Rent share`, splitMethod: 'equal', date: daysAgo(3) },
    { group: home._id, payer: me._id, participants: [me._id, anas._id, omar._id], amount: 210, description: `${MARKER} Groceries`, splitMethod: 'equal', date: daysAgo(2) },
    { group: foot._id, payer: omar._id, participants: [me._id, omar._id, mehdi._id, yassine._id], amount: 200, description: `${MARKER} Pitch rental`, splitMethod: 'equal', date: daysAgo(1) },
  ]);
  for (const group of [trip, home, foot]) {
    group.expenses = expenses.filter((e) => e.group.equals(group._id)).map((e) => e._id);
    await group.save();
  }

  await Notification.create([
    { userId: me._id, senderId: imane._id, type: 'FRIEND_REQUEST', title: 'Friend request', message: `${MARKER} Imane sent you a friend request`, relatedId: pendingFromImane._id },
    { userId: me._id, senderId: salma._id, type: 'EXPENSE_ADDED', title: 'New expense', message: `${MARKER} Salma added "Group dinner" in Chefchaouen Trip`, relatedId: trip._id },
  ]);

  console.log('\nSeed complete. Log in as any seeded user with password:', PASSWORD);
  console.log('Main account (kept):', MAIN_EMAIL);
  for (const u of Object.values(users)) console.log(`  friend: ${u.email}  (${u._id})`);
  console.log(`Groups: ${trip.name} / ${home.name} / ${foot.name}`);
  console.log('Test: GET /api/friends (5), GET /api/friends/requests (2 pending), GET /api/groups/me, GET /api/dashboard');
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
