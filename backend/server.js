//////////////////////////////////////////////////
require("dotenv").config();

const connectDB = require("./config/database");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const PORT = process.env.PORT || 6664;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
/////////////////////////////////////////////////

const Group = require("./models/Group");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const friendRoutes = require("./routes/friendRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupInvitationRoutes = require("./routes/groupInvitationRoutes");

//////////////////////////////////

app.get("/user1", (req, res) => {
  res.render("user1");
});
app.get("/user2", (req, res) => {
  res.render("user2");
});
app.get("/friend_user1", (req, res) => {
  res.render("friend_user1");
});
app.use("/api/group-invitations", groupInvitationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);
app.use("/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/conversations", conversationRoutes);

////////////////////////////////////////////////////////////////

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

  server.listen(PORT, () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );

  });

};

startServer();