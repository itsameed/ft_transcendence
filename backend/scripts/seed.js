/**
 * Dev seed data for Splitify.
 *
 *   node scripts/seed.js            wipe the database, then seed a fresh set
 *   node scripts/seed.js --clean    wipe only, seed nothing
 *   node scripts/seed.js --no-wipe  seed on top of existing data (skips if users exist)
 *
 * Every seeded account uses the same password so you can log in as anyone.
 * The primary account is demo@splitify.test.
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

const PASSWORD = 'Password123!';
const PRIMARY_EMAIL = 'demo@splitify.test';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
  email: 'admin@splitify.test',
  displayName: 'Admin User',
  bio: 'Platform administrator'
};

const AVATARS = ['aurora', 'clay', 'stone', 'slate', 'moss', 'plum', 'sand', 'ink'];
const avatarFor = (i) => `/avatars/${AVATARS[i % AVATARS.length]}.svg`;

const PEOPLE = [
  { username: 'demo', displayName: 'Demo User', email: PRIMARY_EMAIL, bio: 'The account you log in with' },
  { username: 'yassine', displayName: 'Yassine El Amrani', email: 'yassine@splitify.test', bio: 'Always up for a road trip' },
  { username: 'salma', displayName: 'Salma Bennani', email: 'salma@splitify.test', bio: 'Chief expense tracker' },
  { username: 'omar', displayName: 'Omar Haddad', email: 'omar@splitify.test', bio: 'Pays first, asks later' },
  { username: 'hiba', displayName: 'Hiba Mansouri', email: 'hiba@splitify.test', bio: 'Surf, sun, split' },
  { username: 'anas', displayName: 'Anas El Fassi', email: 'anas@splitify.test', bio: 'Roommate and co-payer' },
  { username: 'imane', displayName: 'Imane Chraibi', email: 'imane@splitify.test', bio: 'New here — send me a request' },
  { username: 'mehdi', displayName: 'Mehdi Alaoui', email: 'mehdi@splitify.test', bio: 'Football every Friday' },
  { username: 'nadia', displayName: 'Nadia Berrada', email: 'nadia@splitify.test', bio: 'Keeps the receipts' },
];

const daysAgo = (n, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/** Drops every document in every collection, including connect-mongo sessions. */
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

async function seed() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const users = {};
  const adminUser = await User.findOneAndUpdate(
    { email: ADMIN_CREDENTIALS.email },
    {
      $setOnInsert: {
        username: ADMIN_CREDENTIALS.username,
        displayName: ADMIN_CREDENTIALS.displayName,
        email: ADMIN_CREDENTIALS.email,
        bio: ADMIN_CREDENTIALS.bio,
        password: await bcrypt.hash(ADMIN_CREDENTIALS.password, 10),
        avatar: avatarFor(0),
        isVerified: true,
        joinedAt: daysAgo(365),
        role: 'admin',
        status: 'active',
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  users.admin = adminUser;

  for (const [index, person] of PEOPLE.entries()) {
    users[person.username] = await User.create({
      ...person,
      password: passwordHash,
      avatar: avatarFor(index),
      isVerified: true,
      joinedAt: daysAgo(120 - index * 5),
      role: 'user',
    });
  }

  const { demo, yassine, salma, omar, hiba, anas, imane, mehdi, nadia } = users;

  // Friendships: accepted, plus one incoming and one outgoing request.
  await Friendship.create([
    { requester: demo._id, receiver: yassine._id, status: 'ACCEPTED' },
    { requester: salma._id, receiver: demo._id, status: 'ACCEPTED' },
    { requester: demo._id, receiver: omar._id, status: 'ACCEPTED' },
    { requester: hiba._id, receiver: demo._id, status: 'ACCEPTED' },
    { requester: anas._id, receiver: demo._id, status: 'ACCEPTED' },
    { requester: yassine._id, receiver: salma._id, status: 'ACCEPTED' },
    { requester: omar._id, receiver: mehdi._id, status: 'ACCEPTED' },
    { requester: imane._id, receiver: demo._id, status: 'PENDING' },
    { requester: demo._id, receiver: nadia._id, status: 'PENDING' },
  ]);

  const member = (user, role = 'member', joined = 20) => ({
    userId: user._id,
    role,
    joinedAt: daysAgo(joined),
  });

  async function makeGroup({ name, kind, owner, members, description, createdDaysAgo = 30 }) {
    const conversation = await Conversation.create({ participants: members.map((m) => m.userId) });
    return Group.create({
      name,
      kind,
      createdBy: owner._id,
      description,
      members,
      conversationId: conversation._id,
      createdAt: daysAgo(createdDaysAgo),
    });
  }

  const trip = await makeGroup({
    name: 'Chefchaouen Trip',
    kind: 'trip',
    owner: demo,
    members: [member(demo, 'owner'), member(yassine), member(salma), member(hiba)],
    description: 'Blue city weekend',
    createdDaysAgo: 40,
  });

  const home = await makeGroup({
    name: 'Apartment 4B',
    kind: 'home',
    owner: anas,
    members: [member(anas, 'owner'), member(demo), member(omar)],
    description: 'Shared flat bills',
    createdDaysAgo: 90,
  });

  const football = await makeGroup({
    name: 'Friday Football',
    kind: 'sports',
    owner: demo,
    members: [member(demo, 'owner'), member(omar), member(mehdi), member(yassine)],
    description: 'Weekly five-a-side',
    createdDaysAgo: 60,
  });

  const dinner = await makeGroup({
    name: 'Rooftop Dinner',
    kind: 'dinner',
    owner: salma,
    members: [member(salma, 'owner'), member(demo), member(hiba), member(nadia)],
    description: 'One-off dinner split',
    createdDaysAgo: 12,
  });

  const expenses = await Expense.create([
    // Chefchaouen Trip — equal and custom splits so balances go both ways.
    { group: trip._id, payer: demo._id, participants: [demo._id, yassine._id, salma._id, hiba._id], amount: 1200, description: 'Riad deposit', splitMethod: 'equal', date: daysAgo(6) },
    { group: trip._id, payer: salma._id, participants: [demo._id, yassine._id, salma._id, hiba._id], amount: 640, description: 'Group dinner', splitMethod: 'equal', date: daysAgo(5) },
    { group: trip._id, payer: yassine._id, participants: [demo._id, yassine._id, salma._id], amount: 450, description: 'Taxi and guide', splitMethod: 'custom', customSplit: [{ user: demo._id, amount: 200 }, { user: yassine._id, amount: 100 }, { user: salma._id, amount: 150 }], date: daysAgo(4) },
    { group: trip._id, payer: hiba._id, participants: [demo._id, yassine._id, salma._id, hiba._id], amount: 180, description: 'Breakfast', splitMethod: 'equal', date: daysAgo(3) },

    // Apartment 4B — recurring household costs.
    { group: home._id, payer: anas._id, participants: [demo._id, anas._id, omar._id], amount: 900, description: 'Rent share', splitMethod: 'equal', date: daysAgo(3) },
    { group: home._id, payer: demo._id, participants: [demo._id, anas._id, omar._id], amount: 210, description: 'Groceries', splitMethod: 'equal', date: daysAgo(2) },
    { group: home._id, payer: omar._id, participants: [demo._id, anas._id, omar._id], amount: 150, description: 'Internet', splitMethod: 'equal', date: daysAgo(1) },

    // Friday Football — pitch rental.
    { group: football._id, payer: omar._id, participants: [demo._id, omar._id, mehdi._id, yassine._id], amount: 200, description: 'Pitch rental', splitMethod: 'equal', date: daysAgo(1) },

    // Rooftop Dinner — already partly settled below.
    { group: dinner._id, payer: salma._id, participants: [salma._id, demo._id, hiba._id, nadia._id], amount: 800, description: 'Dinner and drinks', splitMethod: 'equal', date: daysAgo(10) },
  ]);

  for (const group of [trip, home, football, dinner]) {
    group.expenses = expenses.filter((e) => e.group.equals(group._id)).map((e) => e._id);
    await group.save();
  }

  // A recorded payment so the settle-up flow has history to show.
  await Settlement.create({
    group: dinner._id,
    fromUser: demo._id,
    toUser: salma._id,
    amount: 200,
    status: 'accepted',
    date: daysAgo(8),
  });

  // Chat history in the trip conversation.
  await Message.create([
    { conversationId: trip.conversationId, senderId: demo._id, content: 'Booked the riad — 1200 total.', createdAt: daysAgo(6, 10) },
    { conversationId: trip.conversationId, senderId: yassine._id, content: 'Nice. I will grab the taxi when we arrive.', createdAt: daysAgo(6, 10) },
    { conversationId: trip.conversationId, senderId: salma._id, content: 'Dinner is on me tonight, add it to the group.', createdAt: daysAgo(5, 19) },
    { conversationId: trip.conversationId, senderId: hiba._id, content: 'Breakfast place near the square is great.', createdAt: daysAgo(3, 9) },
  ]);

  await Notification.create([
    { userId: demo._id, senderId: imane._id, type: 'FRIEND_REQUEST', title: 'Friend request', message: 'Imane sent you a friend request', relatedId: imane._id },
    { userId: demo._id, senderId: salma._id, type: 'EXPENSE_ADDED', title: 'New expense', message: 'Salma added "Group dinner" in Chefchaouen Trip', relatedId: trip._id },
    { userId: demo._id, senderId: omar._id, type: 'PAYMENT_REMINDER', title: 'Payment reminder', message: 'Omar reminded you about the pitch rental', relatedId: football._id },
    { userId: demo._id, senderId: anas._id, type: 'EXPENSE_ADDED', title: 'New expense', message: 'Anas added "Rent share" in Apartment 4B', relatedId: home._id, isRead: true },
  ]);

  await GroupInvitation.create({
    groupId: dinner._id,
    invitedUserId: mehdi._id,
    invitedBy: salma._id,
    status: 'pending',
  });

  return { users: Object.values(users), groups: [trip, home, football, dinner], expenses };
}

async function main() {
  const cleanOnly = process.argv.includes('--clean');
  const noWipe = process.argv.includes('--no-wipe');

  await mongoose.connect(process.env.MONGO_URL);
  console.log(`Connected to ${mongoose.connection.name}`);

  if (!noWipe) {
    const removed = await wipeDatabase();
    console.log(removed.length ? `Wiped: ${removed.join(', ')}` : 'Database was already empty.');
  }

  if (cleanOnly) {
    console.log('Clean only — nothing seeded.');
    return;
  }

  if (noWipe && (await User.countDocuments()) > 0) {
    console.log('Users already exist and --no-wipe was passed. Nothing to do.');
    return;
  }

  const { users, groups, expenses } = await seed();

  console.log('\nSeed complete.');
  console.log(`  users:      ${users.length}`);
  console.log(`  groups:     ${groups.length}`);
  console.log(`  expenses:   ${expenses.length}`);
  console.log(`\nLog in with any account, password: ${PASSWORD}`);
  for (const user of users) {
    console.log(`  ${user.email.padEnd(28)} ${user.displayName}`);
  }
  console.log('\nTry: /dashboard, /groups, /chat, /notifications');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
