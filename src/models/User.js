const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First Name is required"],
      minLength: [3, "First Name must be at least 3 characters"],
      maxLength: [20, "First Name must be at most 20 characters"],
      trim: true,
      uppercase: true,
    },
    lastName: {
      type: String,
      required: [true, "Last Name is required"],
      minLength: [3, "Last Name must be at least 3 characters"],
      maxLength: [20, "Last Name must be at most 20 characters"],
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
      minLength: [6, "Email must be at least 6 characters"],
      maxLength: [50, "Email must be at most 50 characters"],
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters"],
      maxLength: [100, "Password must be at most 100 characters"],
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Password is not strong enough");
        }
      },
      message: "Password is not strong enough",
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["male", "female", "transgender"],
        message: "Gender must be male, female, or transgender",
      },
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Age must be at least 18"],
      max: [130, "Age must be at most 130"],
    },
    profilePic: {
      type: String,
      default:
        "https://t4.ftcdn.net/jpg/00/64/67/27/360_F_64672736_U5kpdGs9keUll8CRQ3p3YaEv2M6qkVY5.jpg",
      validate: {
        validator(value) {
          if (!validator.isURL(value)) {
            throw new Error("Invalid Profile Photo URL");
          }
        },
        message: "Invalid Profile Photo URL",
      },
    },
    about: {
      type: String,
      default: "I am a developer",
      minLength: [3, "About must be at least 3 characters"],
      maxLength: [200, "About must be at most 200 characters"],
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
