const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const sessionMiddleware = (session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
  }),
  cookie: {
  secure: process.env.COOKIE_SECURE === 'true',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000
  }
}));

module.exports = sessionMiddleware;