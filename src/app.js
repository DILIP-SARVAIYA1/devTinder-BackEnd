const express = require("express");
const connectDB = require("./config/database");
const app = express();
const User = require("./models/User");
const { validateSignUpData } = require("./helpers/validation");
const bcrypt = require("bcrypt");
app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);
    const hashedPassword = await bcrypt.hash(req.body.password, 13);
    const user = new User(req.body);
    console.log(user);

    user.password = hashedPassword;
    await user.save();
    res.status(201).send("user created");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).send("Invalid email or password");
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(401).send("Invalid email or password");
    }
    res.status(200).send("user logged in");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({ email: req.body.email });
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete("/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send("Invalid user ID format");
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.status(200).send("User deleted");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.patch("/user/:id", async (req, res) => {
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
    const isValidOperation = Object.keys(data).every((key) =>
      ALLOWED_UPDATES.includes(key)
    );
    if (!isValidOperation) {
      return res.status(400).send({ error: "Invalid updates!" });
    }
    if (data.skills.length > 5) {
      return res.status(400).send({ error: "skills cannot be more than 5" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
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
