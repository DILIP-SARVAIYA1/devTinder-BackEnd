const express = require("express");
const usersReqRouter = express.Router();
const ConnectionRequest = require("../models/ConnectionRequest");
const { userAuth } = require("../middlewares/userAuth");
const paginationMiddleware = require("../middlewares/paginationMiddleware");
const User = require("../models/User");
const sendResponse = require("../helpers/response"); // Assuming this is a utility for consistent API responses

// ---
// ## Route: GET /usersRequest/received
// Description: Retrieves all connection requests received by the logged-in user
//              that have a status of "interested" (i.e., pending requests).
// Middleware:
//   - userAuth: Authenticates the user and attaches user information to `req.user`.
//   - paginationMiddleware: Parses pagination parameters (page, limit, skip) from `req.query`.
// ---
usersReqRouter.get(
  "/usersRequest/received",
  userAuth,
  paginationMiddleware,
  async (req, res, next) => {
    try {
      // Ensure loggedInUserId is a string for consistent comparisons with Mongoose ObjectIds
      const loggedInUserId = req.user._id.toString();
      const { page, limit, skip } = req.pagination;

      // Query for connection requests where the current user is the recipient
      // and the status is 'interested'.
      const usersRequests = await ConnectionRequest.find({
        toUserId: loggedInUserId,
        status: "interested",
      })
        // Populate 'fromUserId' to get details of the users who sent the requests.
        // Select only necessary fields to reduce payload size.
        .populate("fromUserId", "firstName lastName profilePic skills")
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .skip(skip) // Apply pagination skip
        .limit(limit); // Apply pagination limit

      // Get the total count of matching documents for pagination metadata.
      const totalRequests = await ConnectionRequest.countDocuments({
        toUserId: loggedInUserId,
        status: "interested",
      });

      // Send a success response with the retrieved data and pagination info.
      sendResponse(res, {
        success: true,
        message: usersRequests.length
          ? "Connection requests retrieved successfully."
          : "No pending connection requests available.", // More specific message
        data: usersRequests,
        pagination: { total: totalRequests, page, limit },
      });
    } catch (error) {
      // Pass any errors to the next middleware (error handling middleware).
      console.error("Error fetching received connection requests:", error); // Log the error
      next(error);
    }
  }
);

// ---
// ## Route: GET /usersConnections
// Description: Retrieves all accepted connections (friends) for the logged-in user.
//              It ensures that the 'connectionUser' field always represents the other user in the connection.
// Middleware:
//   - userAuth: Authenticates the user.
//   - paginationMiddleware: Parses pagination parameters.
// ---
usersReqRouter.get(
  "/usersConnections",
  userAuth,
  paginationMiddleware,
  async (req, res, next) => {
    try {
      const loggedInUserId = req.user._id.toString();
      const { page, limit, skip } = req.pagination;

      // Fetch connection requests where the logged-in user is either the sender or receiver,
      // and the status is 'accepted'.
      const usersConnections = await ConnectionRequest.find({
        $or: [
          { fromUserId: loggedInUserId, status: "accepted" },
          { toUserId: loggedInUserId, status: "accepted" },
        ],
      })
        // Populate both `fromUserId` and `toUserId` to determine the 'other' user.
        .populate("fromUserId", "firstName lastName profilePic skills")
        .populate("toUserId", "firstName lastName profilePic skills")
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .skip(skip) // Apply pagination skip
        .limit(limit); // Apply pagination limit

      // Transform the fetched connections to always return the 'other' user
      // as `connectionUser` for easier client-side consumption.
      const connections = usersConnections.map((conn) => {
        let connectionUser;
        // Determine which user is the 'other' user in the connection.
        if (conn.fromUserId._id.toString() === loggedInUserId) {
          connectionUser = conn.toUserId;
        } else {
          connectionUser = conn.fromUserId;
        }
        return {
          _id: conn._id, // ConnectionRequest ID
          status: conn.status,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
          connectionUser: connectionUser, // The connected user's details
        };
      });

      // Get the total count of accepted connections for pagination metadata.
      const totalConnections = await ConnectionRequest.countDocuments({
        $or: [
          { fromUserId: loggedInUserId, status: "accepted" },
          { toUserId: loggedInUserId, status: "accepted" },
        ],
      });

      // Send a success response.
      sendResponse(res, {
        success: true,
        message:
          connections.length > 0
            ? "Connections retrieved successfully."
            : "No connections available.",
        data: connections,
        pagination: { total: totalConnections, page, limit },
      });
    } catch (error) {
      console.error("Error fetching user connections:", error); // Log the error
      next(error);
    }
  }
);

// ---
// ## Route: GET /usersSentLikes
// Description: Retrieves all connection requests sent by the logged-in user
//              that have a status of "interested" (i.e., pending likes).
// Middleware:
//   - userAuth: Authenticates the user.
//   - paginationMiddleware: Parses pagination parameters.
// ---
usersReqRouter.get(
  "/usersSentLikes",
  userAuth,
  paginationMiddleware,
  async (req, res, next) => {
    try {
      const loggedInUserId = req.user._id.toString();
      const { page, limit, skip } = req.pagination;

      // Query for connection requests where the current user is the sender
      // and the status is 'interested'.
      const usersSentLikes = await ConnectionRequest.find({
        fromUserId: loggedInUserId,
        status: "interested",
      })
        // Populate 'toUserId' to get details of the users to whom likes were sent.
        .populate("toUserId", "firstName lastName profilePic skills")
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .skip(skip) // Apply pagination skip
        .limit(limit); // Apply pagination limit

      // Get the total count of matching documents for pagination metadata.
      const totalSentLikes = await ConnectionRequest.countDocuments({
        fromUserId: loggedInUserId,
        status: "interested",
      });

      // Send a success response.
      sendResponse(res, {
        success: true,
        message: usersSentLikes.length
          ? "Sent likes retrieved successfully."
          : "No sent likes available.", // More specific message
        data: usersSentLikes,
        pagination: { total: totalSentLikes, page, limit },
      });
    } catch (error) {
      console.error("Error fetching sent likes:", error); // Log the error
      next(error);
    }
  }
);

// ---
// ## Route: GET /usersFeed
// Description: Retrieves a paginated list of users for the feed, excluding
//              the logged-in user and any users they have already interacted with
//              (sent/received connection requests, regardless of status).
//              Optionally filters by gender.
// Middleware:
//   - userAuth: Authenticates the user.
//   - paginationMiddleware: Parses pagination parameters.
// ---
usersReqRouter.get(
  "/usersFeed",
  userAuth,
  paginationMiddleware,
  async (req, res, next) => {
    try {
      const loggedInUserId = req.user._id.toString();
      const { page, limit, skip } = req.pagination;

      // Find all user IDs that the logged-in user has already interacted with
      // (either sent a request to, or received a request from).
      // This ensures they don't appear in the feed again.
      const interactedUserIds = new Set();

      // Add users to whom the logged-in user has sent a request
      const sentRequests = await ConnectionRequest.distinct("toUserId", {
        fromUserId: loggedInUserId,
      });
      sentRequests.forEach((id) => interactedUserIds.add(id.toString()));

      // Add users from whom the logged-in user has received a request
      const receivedRequests = await ConnectionRequest.distinct("fromUserId", {
        toUserId: loggedInUserId,
      });
      receivedRequests.forEach((id) => interactedUserIds.add(id.toString()));

      // Add the logged-in user's ID to the set to ensure they don't appear in their own feed.
      interactedUserIds.add(loggedInUserId);

      // Build the filter for fetching users for the feed.
      const usersFilter = {
        _id: { $nin: Array.from(interactedUserIds) }, // Exclude interacted users
      };

      // Add gender filter if provided in the query parameters.
      if (req.query.gender) {
        usersFilter.gender = req.query.gender;
      }

      // Fetch users based on the constructed filter.
      const usersFeed = await User.find(usersFilter)
        // Select only necessary fields to reduce payload size.
        .select("_id firstName lastName profilePic skills aboutMe age gender")
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .skip(skip) // Apply pagination skip
        .limit(limit); // Apply pagination limit

      // Get the total count of users matching the feed criteria for pagination metadata.
      const totalFeedUsers = await User.countDocuments(usersFilter);

      // Send a success response.
      sendResponse(res, {
        success: true,
        message: usersFeed.length
          ? "User feed retrieved successfully."
          : "No new users available in the feed.", // More specific message
        data: usersFeed,
        pagination: { total: totalFeedUsers, page, limit },
      });
    } catch (error) {
      console.error("Error fetching user feed:", error); // Log the error
      next(error);
    }
  }
);

module.exports = usersReqRouter;
