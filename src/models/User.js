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
      index: true, // Add index
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
        message:
          "Gender must be one of the following: male, female, or transgender",
      },
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      index: true, // Add index
      min: [18, "Age must be at least 18"],
      max: [130, "Age must be at most 130"],
    },
    profilePic: {
      type: String,
      default: function () {
        if (this.gender === "male") {
          return "https://example.com/default-male.jpg";
        } else if (this.gender === "female") {
          return "https://example.com/default-female.jpg";
        } else {
          return "https://example.com/default-transgender.jpg";
        }
      },
      validate: {
        validator(value) {
          return validator.isURL(value);
        },
        message: "Invalid Profile Photo URL",
      },
    },
    about: {
      type: String,
      default: function () {
        return `I am ${this.firstName}, a developer`;
      },
      minLength: [3, "About must be at least 3 characters"],
      maxLength: [200, "About must be at most 200 characters"],
    },
    skills: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (value) {
            return value.length <= 5;
          },
          message: "Skills cannot exceed 5 items",
        },
        {
          validator: function (value) {
            return value.every(
              (skill) =>
                typeof skill === "string" &&
                skill.trim().length > 0 &&
                skill.length <= 50
            );
          },
          message:
            "Each skill must be a non-empty string with a maximum length of 50 characters",
        },
      ],
    },
  },
  { timestamps: true }
);

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const bcrypt = require("bcrypt");
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
