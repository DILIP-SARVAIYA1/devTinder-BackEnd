const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendResponse = require("../helpers/response");

const userAuth = async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return sendResponse(res, {
        success: false,
        message: "Unauthorized access, please log in!",
        status: 401,
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devTinder");

    // Find the user and exclude the password field
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return sendResponse(res, {
        success: false,
        message: "User not found, please log in again!",
        status: 401,
      });
    }

    // Attach user to the request object
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return sendResponse(res, {
        success: false,
        message: "Token has expired, please log in again",
        status: 401,
      });
    }
    if (error.name === "JsonWebTokenError") {
      return sendResponse(res, {
        success: false,
        message: "Invalid token, please log in again",
        status: 401,
      });
    }

    // Log and handle unexpected errors
    console.error("Error in userAuth middleware:", error);
    sendResponse(res, {
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
};

module.exports = { userAuth };
