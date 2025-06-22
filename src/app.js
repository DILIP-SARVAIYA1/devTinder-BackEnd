const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const connectionReqRoutes = require("./routes/connectionReqRoutes");
const usersReqRoutes = require("./routes/usersReqRoutes");
const cors = require("cors");

// CORS configuration
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/", profileRoutes);
app.use("/", authRoutes);
app.use("/", connectionReqRoutes);
app.use("/", usersReqRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(require("./helpers/errorHandler"));

const PORT = process.env.PORT || 1111;

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
