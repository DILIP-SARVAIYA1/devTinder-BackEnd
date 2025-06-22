const express = require("express");
const profileRoutes = express.Router();
const User = require("../models/User");
const { userAuth } = require("../middlewares/userAuth");
const validator = require("validator");
const validateObjectId = require("../middlewares/validateObjectId");
const ConnectionRequest = require("../models/ConnectionRequest");
const sendResponse = require("../helpers/response");

profileRoutes.get("/profile/view", userAuth, async (req, res) => {
  try {
    if (!req.user) {
      return sendResponse(res, {
        success: false,
        message: "User not authenticated",
        status: 401,
      });
    }
    const {
      _id,
      firstName,
      lastName,
      email,
      profilePic,
      about,
      skills,
      gender,
      age,
    } = req.user;
    sendResponse(res, {
      success: true,
      data: {
        _id,
        firstName,
        lastName,
        email,
        profilePic,
        about,
        skills,
        gender,
        age,
      },
    });
  } catch (error) {
    console.error("Error in /profile/view:", error);
    sendResponse(res, {
      success: false,
      message: "Failed to fetch profile. Please try again later.",
      status: 500,
    });
  }
});

profileRoutes.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // Find all users who are already connected or have a pending/accepted connection with the logged-in user
    const connections = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUserId }, { toUserId: loggedInUserId }],
      status: { $in: ["accepted", "interested"] },
    }).select("fromUserId toUserId");

    // Collect all user IDs to exclude (already connected or requested)
    const excludeUserIds = new Set([loggedInUserId.toString()]);
    for (const conn of connections) {
      excludeUserIds.add(conn.fromUserId.toString());
      excludeUserIds.add(conn.toUserId.toString());
    }

    // Pagination
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find users not in the exclude list
    const [feedUsers, total] = await Promise.all([
      User.find({ _id: { $nin: Array.from(excludeUserIds) } })
        .select(
          "firstName lastName profilePic skills gender age about createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ _id: { $nin: Array.from(excludeUserIds) } }),
    ]);

    sendResponse(res, {
      success: true,
      data: feedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /feed:", error);
    sendResponse(res, {
      success: false,
      message: "Failed to fetch user feed. Please try again later.",
      status: 500,
    });
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
      console.error("Error in /profile/update/:id:", error);
      sendResponse(res, {
        success: false,
        message: "An unexpected error occurred while updating the profile",
        status: 500,
      });
    }
  }
);

module.exports = profileRoutes;
