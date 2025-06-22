const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["ignored", "interested", "accepted", "rejected"],
        message: `{VALUE} is not supported`,
      },
    },
  },
  { timestamps: true }
);

// Ensure unique connection between two users regardless of direction
connectionRequestSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true, name: "unique_connection" }
);

// Add a compound index for faster status queries
connectionRequestSchema.index(
  { toUserId: 1, status: 1 },
  { name: "toUser_status_idx" }
);

// Optionally, hide __v in responses
connectionRequestSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const ConnectionRequest = mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema
);

module.exports = ConnectionRequest;
