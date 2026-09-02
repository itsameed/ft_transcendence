//////////////////////////////////////////////////
require("dotenv").config();
const connectDB = require("./config/database");
const express = require('express');
const app = express();
const PORT = process.env.PORT || 6664;
/////////////////////////////////////////////////

const userRoutes = require("./routes/userRoutes");
const { getWelcome } = require("./controllers/userController");

//////////////////////////////////
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(express.json());
//////////////////////////////////
app.set('view engine', 'ejs')

app.get("/welcome", getWelcome);
app.use("/users", userRoutes);

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