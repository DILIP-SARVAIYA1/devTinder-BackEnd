const express = require("express");
const profileRoutes = express.Router();
const User = require("../models/User");
const { userAuth } = require("../middlewares/userAuth");
const validator = require("validator");
const validateObjectId = require("../middlewares/validateObjectId");
const ConnectionRequest = require("../models/ConnectionRequest");
const sendResponse = require("../helpers/response");

profileRoutes.get("/profile/view", userAuth, async (req, res, next) => {
  try {
    // Retrieve the latest user data from the database
    const user = await User.findById(req.user._id).select(
      "_id firstName lastName email profilePic about skills gender age createdAt updatedAt"
    );
    if (!user) {
      return sendResponse(res, {
        success: false,
        message: "User not found",
        status: 404,
      });
    }
    sendResponse(res, {
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

profileRoutes.delete("/profile/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendResponse(res, {
        success: false,
        message: "Invalid user ID format",
        status: 400,
      });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return sendResponse(res, {
        success: false,
        message: "User not found",
        status: 404,
      });
    }
    sendResponse(res, {
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in /profile/delete/:id:", error);
    sendResponse(res, {
      success: false,
      message: error.message,
      status: 500,
    });
  }
});

profileRoutes.patch(
  "/profile/update/:id",
  userAuth,
  validateObjectId,
  async (req, res, next) => {
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
        return sendResponse(res, {
          success: false,
          message: "Invalid user ID format",
          status: 400,
        });
      }

      // Check for empty request body
      if (!Object.keys(data).length) {
        return sendResponse(res, {
          success: false,
          message: "Request body cannot be empty",
          status: 400,
        });
      }

      // Validate allowed updates
      const isValidOperation = Object.keys(data).every((key) =>
        ALLOWED_UPDATES.includes(key)
      );
      if (!isValidOperation) {
        return sendResponse(res, {
          success: false,
          message:
            "Invalid updates! Allowed fields: firstName, lastName, password, profilePic, about, skills",
          status: 400,
        });
      }

      // Validate skills array
      if (
        data.skills &&
        (!Array.isArray(data.skills) || data.skills.length > 5)
      ) {
        return sendResponse(res, {
          success: false,
          message: "Skills must be an array with a maximum of 5 items",
          status: 400,
        });
      }

      // Validate password strength
      if (data.password) {
        const validator = require("validator");
        if (!validator.isStrongPassword(data.password)) {
          return sendResponse(res, {
            success: false,
            message: "Password is not strong enough",
            status: 400,
          });
        }
        data.password = await bcrypt.hash(data.password, 10);
      }

      // Ensure user can only update their own profile
      if (req.user._id.toString() !== req.params.id) {
        return sendResponse(res, {
          success: false,
          message: "You are not authorized to update this profile",
          status: 403,
        });
      }

      // Update the user
      const user = await User.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        return sendResponse(res, {
          success: false,
          message: "User not found",
          status: 404,
        });
      }

      sendResponse(res, {
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = profileRoutes;
