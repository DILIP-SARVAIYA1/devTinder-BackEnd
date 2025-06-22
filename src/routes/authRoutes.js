const express = require("express");
const authRoutes = express.Router();
const { validateSignUpData } = require("../helpers/validation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendResponse = require("../helpers/response");

// Signup
authRoutes.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();
    const userData = user.toObject();
    delete userData.password;
    sendResponse(res, {
      success: true,
      message: "User created",
      data: userData,
      status: 201,
    });
  } catch (error) {
    sendResponse(res, {
      success: false,
      message: error.message,
      status: 500,
    });
  }
});

// Login
authRoutes.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return sendResponse(res, {
        success: false,
        message: "Invalid email or password",
        status: 401,
      });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return sendResponse(res, {
        success: false,
        message: "Invalid email or password",
        status: 401,
      });
    }
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || "devTinder",
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sameSite: "strict",
    });
    sendResponse(res, {
      success: true,
      message: `${user.firstName} ${user.lastName} logged in`,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
        skills: user.skills,
      },
    });
  } catch (error) {
    sendResponse(res, {
      success: false,
      message: error.message,
      status: 500,
    });
  }
});

// Logout
authRoutes.get("/logout", (req, res) => {
  res.clearCookie("token");
  sendResponse(res, {
    success: true,
    message: "User logged out",
  });
});

module.exports = authRoutes;
