require('dotenv/config');
const express = require('express');
const cookieParser = require('cookie-parser');
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

const notificationRoutes = require("./routes/notificationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const friendRoutes = require("./routes/friendRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupInvitationRoutes = require("./routes/groupInvitationRoutes");
const groupDetailsRouter = require('./routes/GroupDetails');
const loginPageRouter = require('./routes/login.js');
// const userGroupsRouter = require('./routes/groupRoutes.js');
const dashboardRouter = require('./routes/Home.js');
const signupPageRouter = require('./routes/signup.js');
const groupCreationRouter = require('./routes/CreateGroup.js');
const settlementsRouter = require('./routes/Settlement.js');
const expensesRouter = require('./routes/Expenses.js');
const groupTotalExpensesRouter = require('./routes/GroupTotalExpenses.js');
const logoutRouter = require('./routes/Logout.js');
const myProfileRouter = require('./routes/MyProfile.js');
const editProfile = require('./routes/EditProfile.js');
const adminRoutes = require("./routes/adminRoutes");
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
app.use('/profile/edit', editProfile);
app.use('/auth/login', loginPageRouter);
app.use('/auth/signup', signupPageRouter);
// app.use('/Friends', FriendsList);
app.use('/groups/create', groupCreationRouter);
app.use('/settlements', settlementsRouter);
app.use('/settlements/addSettlement', settlementsRouter);

// app.use('/notifications', Notif);
app.use('/my-groups', groupRoutes);
app.use('/expenses', expensesRouter);
app.use('/createExpense', expensesRouter);

app.use('/my-groups/total-expenses', groupTotalExpensesRouter);
app.use("/api/group-invitations", groupInvitationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/admin", adminRoutes);
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