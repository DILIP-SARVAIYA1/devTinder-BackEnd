const express = require("express");
const { userAuth } = require("../middlewares/userAuth");
const validator = require("validator");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/User");
const connectionReqRoutes = express.Router();

connectionReqRoutes.post(
  "/connectionRequests/:status/:id",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.id;
      const status = req.params.status?.toLowerCase();

      // Validate status
      const ALLOWED_UPDATES = ["ignored", "interested"];
      if (!status || !ALLOWED_UPDATES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Allowed values: ignored, interested",
        });
      }

      // Validate user ID
      if (!toUserId || !validator.isMongoId(toUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing user ID format",
        });
      }

      // Validate toUserId existence
      const toUserIdExists = await User.exists({ _id: toUserId });
      if (!toUserIdExists) {
        return res.status(404).json({
          success: false,
          message: "The user you are trying to connect with does not exist",
        });
      }

      // Prevent self-connection requests
      if (fromUserId.toString() === toUserId) {
        return res.status(400).json({
          success: false,
          message: "You cannot send a connection request to yourself",
        });
      }

      // Check if the target user exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({
          success: false,
          message: "The user you are trying to connect with does not exist",
        });
      }

      // Check for existing connection requests
      const existingRequest = await ConnectionRequest.countDocuments({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingRequest > 0) {
        return res.status(400).json({
          success: false,
          message: "Connection request already exists",
        });
      }

      // Create a new connection request
      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      await connectionRequest.save();

      res.status(200).json({
        success: true,
        message: "Connection request sent successfully",
        data: connectionRequest,
      });
    } catch (error) {
      console.error("Error in /connectionRequests:", error);
      res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing the request",
      });
    }
  }
);

connectionReqRoutes.post(
  "/connectionRequests/review/:status/:id",
  userAuth,
  async (req, res) => {
    try {
      const requestId = req.params.id;
      const toUserId = req.user._id.toString();
      const status = req.params.status?.toLowerCase();

      // Validate status
      const ALLOWED_UPDATES = ["accepted", "rejected"];
      if (!status || !ALLOWED_UPDATES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Allowed values: accepted, rejected",
        });
      }

      // Validate request ID
      if (!validator.isMongoId(requestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID format",
        });
      }

      // Fetch the connection request and validate its existence
      const request = await ConnectionRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "The connection request does not exist",
        });
      }

      // Check if the request belongs to the logged-in user
      if (request.toUserId.toString() !== toUserId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to review this connection request",
        });
      }

      // Update the connection request status
      request.status = status;
      await request.save();

      res.status(200).json({
        success: true,
        message: "Connection request status updated successfully",
        data: request,
      });
    } catch (error) {
      console.error("Error in /connectionRequests/review:", error);
      res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing the request",
      });
    }
  }
);

module.exports = connectionReqRoutes;
