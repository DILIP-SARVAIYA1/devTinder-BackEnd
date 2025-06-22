const express = require("express");
const usersReqRouter = express.Router();
const ConnectionRequest = require("../models/ConnectionRequest");
const { userAuth } = require("../middlewares/userAuth");
const paginationMiddleware = require("../middlewares/paginationMiddleware");
const User = require("../models/User");
const sendResponse = require("../helpers/response");

// Get received connection requests
usersReqRouter.get(
  "/usersRequest/received",
  userAuth,
  paginationMiddleware,
  async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const { page, limit, skip } = req.pagination;

      // Fetch connection requests
      const usersRequests = await ConnectionRequest.find({
        toUserId: loggedInUserId,
        status: "interested",
      })
        .populate("fromUserId", "firstName lastName profilePic skills")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalRequests = await ConnectionRequest.countDocuments({
        toUserId: loggedInUserId,
        status: "interested",
      });

      sendResponse(res, {
        success: true,
        message: usersRequests.length
          ? "Connection requests retrieved successfully"
          : "No connection requests available",
        data: usersRequests,
        pagination: { total: totalRequests, page, limit },
      });
    } catch (error) {
      console.error("Error in /usersRequest/received:", error);
      sendResponse(res, {
        success: false,
        message:
          "An unexpected error occurred while retrieving connection requests",
        status: 500,
      });
    }
  }
);

// Get user connections
usersReqRouter.get(
  "/usersConnections",
  userAuth,
  paginationMiddleware,
  async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const { page, limit, skip } = req.pagination;

      // Fetch user connections
      const usersConnections = await ConnectionRequest.find({
        $or: [
          { fromUserId: loggedInUserId, status: "accepted" },
          { toUserId: loggedInUserId, status: "accepted" },
        ],
      })
        .populate("fromUserId", "firstName lastName profilePic skills")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalConnections = await ConnectionRequest.countDocuments({
        $or: [
          { fromUserId: loggedInUserId, status: "accepted" },
          { toUserId: loggedInUserId, status: "accepted" },
        ],
      });

      sendResponse(res, {
        success: true,
        message: usersConnections.length
          ? "Connections retrieved successfully"
          : "No connections available",
        data: usersConnections,
        pagination: { total: totalConnections, page, limit },
      });
    } catch (error) {
      console.error("Error in /usersConnections:", error);
      sendResponse(res, {
        success: false,
        message: "An unexpected error occurred while retrieving connections",
        status: 500,
      });
    }
  }
);

// Get user feed
usersReqRouter.get(
  "/usersFeed",
  userAuth,
  paginationMiddleware,
  async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const { page, limit, skip } = req.pagination;

      // Fetch connected user IDs
      const connectedUserIds = new Set([
        ...(await ConnectionRequest.distinct("toUserId", {
          fromUserId: loggedInUserId,
        })),
        ...(await ConnectionRequest.distinct("fromUserId", {
          toUserId: loggedInUserId,
        })),
      ]);

      // Add the logged-in user to the set to exclude them from the feed
      connectedUserIds.add(loggedInUserId.toString());
      // Build user filter
      const usersFilter = {
        _id: { $nin: Array.from(connectedUserIds) },
      };
      // Add gender filter if provided
      if (req.query.gender) {
        usersFilter.gender = req.query.gender;
      }

      // Fetch users for the feed
      const usersFeed = await User.find(usersFilter)
        .select("firstName lastName profilePic skills aboutMe")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Total count of users in the feed
      const totalFeedUsers = await User.countDocuments(usersFilter);

      sendResponse(res, {
        success: true,
        message: usersFeed.length
          ? "User feed retrieved successfully"
          : "No users available in the feed",
        data: usersFeed,
        pagination: { total: totalFeedUsers, page, limit },
      });
    } catch (error) {
      console.error("Error in /usersFeed:", error);
      sendResponse(res, {
        success: false,
        message: "An unexpected error occurred while retrieving user feed",
        status: 500,
      });
    }
  }
);

module.exports = usersReqRouter;
