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

const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

//////////////////////////////////

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

    socket.on("joinConversation", (conversationId) => {

        socket.join(`conversation:${conversationId}`);

        console.log(
            `Socket ${socket.id} joined conversation ${conversationId}`
        );

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