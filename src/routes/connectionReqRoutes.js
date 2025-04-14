const express = require("express");
const { userAuth } = require("../middlewares/auth");
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

module.exports = connectionReqRoutes;
