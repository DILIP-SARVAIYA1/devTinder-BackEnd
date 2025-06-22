const express = require("express");
const { userAuth } = require("../middlewares/userAuth");
const validator = require("validator");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/User");
const sendResponse = require("../helpers/response");
const connectionReqRoutes = express.Router();

connectionReqRoutes.post(
  "/connectionRequests/:status/:id",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.id;
      const status = req.params.status?.toLowerCase();
      const ALLOWED_UPDATES = ["ignored", "interested"];
      if (!status || !ALLOWED_UPDATES.includes(status)) {
        return sendResponse(res, {
          success: false,
          message: "Invalid status. Allowed values: ignored, interested",
          status: 400,
        });
      }
      if (!toUserId || !validator.isMongoId(toUserId)) {
        return sendResponse(res, {
          success: false,
          message: "Invalid or missing user ID format",
          status: 400,
        });
      }
      const toUserIdExists = await User.exists({ _id: toUserId });
      if (!toUserIdExists) {
        return sendResponse(res, {
          success: false,
          message: "The user you are trying to connect with does not exist",
          status: 404,
        });
      }
      if (fromUserId.toString() === toUserId) {
        return sendResponse(res, {
          success: false,
          message: "You cannot send a connection request to yourself",
          status: 400,
        });
      }
      const existingRequest = await ConnectionRequest.countDocuments({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingRequest > 0) {
        return sendResponse(res, {
          success: false,
          message: "Connection request already exists",
          status: 400,
        });
      }
      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      await connectionRequest.save();
      sendResponse(res, {
        success: true,
        message: "Connection request sent successfully",
        data: connectionRequest,
      });
    } catch (error) {
      console.error("Error in /connectionRequests:", error);
      sendResponse(res, {
        success: false,
        message: "An unexpected error occurred while processing the request",
        status: 500,
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
      const ALLOWED_UPDATES = ["accepted", "rejected"];
      if (!status || !ALLOWED_UPDATES.includes(status)) {
        return sendResponse(res, {
          success: false,
          message: "Invalid status. Allowed values: accepted, rejected",
          status: 400,
        });
      }
      if (!validator.isMongoId(requestId)) {
        return sendResponse(res, {
          success: false,
          message: "Invalid request ID format",
          status: 400,
        });
      }
      const request = await ConnectionRequest.findById(requestId);
      if (!request) {
        return sendResponse(res, {
          success: false,
          message: "The connection request does not exist",
          status: 404,
        });
      }
      if (request.toUserId.toString() !== toUserId) {
        return sendResponse(res, {
          success: false,
          message: "You are not authorized to review this connection request",
          status: 403,
        });
      }
      request.status = status;
      await request.save();
      sendResponse(res, {
        success: true,
        message: "Connection request status updated successfully",
        data: request,
      });
    } catch (error) {
      console.error("Error in /connectionRequests/review:", error);
      sendResponse(res, {
        success: false,
        message: "An unexpected error occurred while processing the request",
        status: 500,
      });
    }
  }
);

module.exports = connectionReqRoutes;
