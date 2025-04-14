const jwt = require("jsonwebtoken");
const User = require("../models/User");

const userAuth = async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access, please log in!",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devTinder");

    // Find the user and exclude the password field
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found, please log in again!",
      });
    }

    // Attach user to the request object
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired, please log in again",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token, please log in again",
      });
    }

    // Log and handle unexpected errors
    console.error("Error in userAuth middleware:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { userAuth };
