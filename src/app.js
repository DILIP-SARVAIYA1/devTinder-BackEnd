const express = require("express");
const connectDB = require("./config/database");
const app = express();
const User = require("./models/User");

app.post("/signup", async (req, res) => {
  const user = new User({
    firstName: "Dilip",
    lastName: "Sarvaiya",
    email: "dilipsarvaiya@gmail.com",
    password: "123456",
    gender: "male",
  });

  await user.save();
  res.send("user created");
});

connectDB()
  .then(() => {
    console.log("connected to database");
    app.listen(7777, () => {
      console.log("server is running on port 7777");
    });
  })
  .catch((err) => {
    console.error(err + "could not connect to database");
  });
