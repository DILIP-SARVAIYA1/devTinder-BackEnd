const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const connectionReqRoutes = require("./routes/connectionReqRoutes");
const usersReqRoutes = require("./routes/usersReqRoutes");

app.use(express.json());
app.use(cookieParser());

app.use("/", profileRoutes);
app.use("/", authRoutes);
app.use("/", connectionReqRoutes);
app.use("/", usersReqRoutes);

const PORT = 1111;

const connectWithRetry = async () => {
  try {
    await connectDB();
    console.log("connected to database");
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error(err + " could not connect to database, retrying...");
    setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
  }
};

connectWithRetry();
