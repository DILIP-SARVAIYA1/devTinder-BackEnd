const express = require("express");
const profileRoutes = express.Router();
const User = require("../models/User");
const { userAuth } = require("../middlewares/auth");
const validator = require("validator");
const validateObjectId = require("../middlewares/validateObjectId");

profileRoutes.get("/profile/view", userAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, profilePic, about, skills } = req.user;
    res.status(200).json({
      success: true,
      data: { firstName, lastName, email, profilePic, about, skills },
    });
  } catch (error) {
    console.error("Error in /profile/view:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

profileRoutes.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error in /feed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

profileRoutes.delete("/profile/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in /profile/delete/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

profileRoutes.patch(
  "/profile/update/:id",
  userAuth,
  validateObjectId,
  async (req, res) => {
    try {
      const data = req.body;
      const ALLOWED_UPDATES = [
        "firstName",
        "lastName",
        "password",
        "profilePic",
        "about",
        "skills",
      ];

      // Validate user ID
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      // Check for empty request body
      if (!Object.keys(data).length) {
        return res.status(400).json({
          success: false,
          message: "Request body cannot be empty",
        });
      }

      // Validate allowed updates
      const isValidOperation = Object.keys(data).every((key) =>
        ALLOWED_UPDATES.includes(key)
      );
      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid updates! Allowed fields: firstName, lastName, password, profilePic, about, skills",
        });
      }

      // Validate skills array
      if (
        data.skills &&
        (!Array.isArray(data.skills) || data.skills.length > 5)
      ) {
        return res.status(400).json({
          success: false,
          message: "Skills must be an array with a maximum of 5 items",
        });
      }

      // Validate password strength
      if (data.password) {
        const validator = require("validator");
        if (!validator.isStrongPassword(data.password)) {
          return res.status(400).json({
            success: false,
            message: "Password is not strong enough",
          });
        }
        data.password = await bcrypt.hash(data.password, 10);
      }

      // Ensure user can only update their own profile
      if (req.user._id.toString() !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this profile",
        });
      }

      // Update the user
      const user = await User.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      console.error("Error in /profile/update/:id:", error);
      res.status(500).json({
        success: false,
        message: "An unexpected error occurred while updating the profile",
      });
    }
  }
);

module.exports = profileRoutes;
