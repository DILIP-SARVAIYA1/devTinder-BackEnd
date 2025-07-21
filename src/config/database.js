const mongoose = require("mongoose");

// ## connectDB Function

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://dilipsarvaiya:5ckqPfiMEcIc5qnl@namastenodejs.qxjng.mongodb.net/devTinderDB"
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Listen for Mongoose connection events for better logging and debugging.
    mongoose.connection.on("connected", () => {
      console.log(
        "Mongoose default connection open to " + conn.connection.host
      );
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose default connection error: " + err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose default connection disconnected");
    });

    // If the Node process ends, close the Mongoose connection
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log(
        "Mongoose default connection disconnected through app termination"
      );
      process.exit(0);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
