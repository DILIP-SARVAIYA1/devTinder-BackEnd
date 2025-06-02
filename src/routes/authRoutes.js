const express = require("express");
const authRoutes = express.Router();
const { validateSignUpData } = require("../helpers/validation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

authRoutes.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User(req.body);

    user.password = hashedPassword;
    await user.save();
    res.status(201).json({ success: true, message: "User created" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

authRoutes.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const token = jwt.sign({ _id: user._id }, "devTinder", { expiresIn: "7d" });
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      sameSite: "strict",
    });
    res.status(200).json({
      success: true,
      message: `${user.firstName} ${user.lastName} logged in`,
      userData: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
        skills: user.skills,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

authRoutes.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "User logged out" });
});

module.exports = authRoutes;
