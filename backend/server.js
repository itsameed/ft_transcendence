//////////////////////////////////////////////////
require("dotenv").config();
const connectDB = require("./config/database");
const express = require('express');
const app = express();
const PORT = process.env.PORT || 6664;
app.use(express.json());
/////////////////////////////////////////////////

const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
app.use("/api/conversations", messageRoutes);
const { getWelcome } = require("./controllers/userController");

//////////////////////////////////
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
//////////////////////////////////
app.set('view engine', 'ejs')

app.get("/welcome", getWelcome);
app.use("/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", conversationRoutes);

app.get('/', (req, res) => {
    res.sendFile('./views/index.html', { root: __dirname });
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();