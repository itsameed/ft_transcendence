require('dotenv/config');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const connectDB = require("./config/database.js");
const app = express();
const http = require("http");
const { Server } = require("socket.io");


app.set("view engine", 'ejs');
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.static(`public`));
app.use(cookieParser());

///////////////////////////////////////////////// Models Routes //////////////////////////////////////////////////

const Group = require("./models/Schemas/Group");
const notificationRoutes = require("./routes/notificationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const friendRoutes = require("./routes/friendRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupInvitationRoutes = require("./routes/groupInvitationRoutes");
// const FriendsList = require('./routes/friendRoutes.js');
const groupDetailsRouter = require('./routes/get_routes/GroupDetails');
// Route Imports (with .js extensions)
const loginPageRouter = require('./routes/get_routes/login.js');
const postLogin = require('./routes/post_routes/login.js');
const postSignup = require('./routes/post_routes/signup.js');
// const Notif = require('./routes/get_routes/Notifications.js');
const userGroupsRouter = require('./routes/get_routes/MyGroups.js');
const dashboardRouter = require('./routes/get_routes/Home.js');
const signupPageRouter = require('./routes/get_routes/signup.js');
// const postCreateGroup = require('./routes/post_routes/createGroup.js');
// const getCreateGroup = require('./routes/get_routes/CreateGroup.js');
const expensesRouter = require('./routes/get_routes/Expenses.js');
const createExpenseRouter = require('./routes/post_routes/createExpense.js');
const groupTotalExpensesRouter = require('./routes/get_routes/GroupTotalExpenses');
const logoutRouter = require('./routes/get_routes/Logout');
const myProfileRouter = require('./routes/get_routes/MyProfile');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
  }),
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
}));




//////////////////////////// Routes use ////////////////////////////////////////

app.use('/dashboard', dashboardRouter);
app.use('/', dashboardRouter);
app.use('/group-details', groupDetailsRouter);
app.use('/my-profile', myProfileRouter);
app.use('/auth/login', loginPageRouter);
app.use('/auth/login', postLogin);
app.use(`/auth/signup`, postSignup);
app.use('/auth/signup', signupPageRouter);
// app.use('/Friends', FriendsList);
// app.use(`/CreateGroup`, postCreateGroup);
// app.use(`/CreateGroup`, getCreateGroup);
// app.use('/notifications', Notif);
app.use('/my-groups', userGroupsRouter);
app.use('/expenses', createExpenseRouter);
app.use('/expenses', expensesRouter);
app.use('/my-groups/total-expenses', groupTotalExpensesRouter);
app.use("/api/group-invitations", groupInvitationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use('/auth/logout', logoutRouter);

////////////////////////////////////////////////////////////////////////////
app.use((err, req, res, next) => {
  if (err.name !== "CastError") {
    console.error(err);
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID"
    });
  }

  return res.status(500).json({
    message: "Server error"
  });
});

const server = http.createServer(app);

const io = new Server(server);

app.set("io", io);

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("joinUser", (userId) => {

    socket.join(`user:${userId}`);

    console.log(
      `Socket ${socket.id} joined user room ${userId}`
    );

  });

  socket.on("joinConversation", async (conversationId, userId) => {
    try {

      const group = await Group.findOne({
        conversationId: conversationId,
        "members.userId": userId
      });

      if (!group) {
        socket.emit("chatError", {
          message: "You are not a member of this group"
        });
        return;
      }

      socket.join(`conversation:${conversationId}`);

      console.log(
        `User ${userId} joined conversation:${conversationId}`
      );

    } catch (error) {
      console.error(error);

      socket.emit("chatError", {
        message: "Could not join conversation"
      });
    }
  });

  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

  });

});

////////////////////////////////////////////////////////////////

const startServer = async () => {

  await connectDB();

  server.listen(process.env.PORT, () => {

    console.log(
      `Server running on http://localhost:${process.env.PORT}`
    );

  });

};

startServer();