const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, email, password, age } = req.body;

  if (!firstName) {
    throw new Error("First Name is required");
  }
  if (firstName.length < 3 || firstName.length > 20) {
    throw new Error("First Name must be between 3 and 20 characters");
  }
  if (!lastName) {
    throw new Error("Last Name is required");
  }
  if (lastName.length < 3 || lastName.length > 20) {
    throw new Error("Last Name must be between 3 and 20 characters");
  }
  if (!email) {
    throw new Error("Email is required");
  }
  if (!validator.isEmail(email)) {
    throw new Error("Invalid email");
  }
  if (!password) {
    throw new Error("Password is required");
  }
  if (password.length < 8 || password.length > 100) {
    throw new Error("Password must be between 8 and 100 characters");
  }
  if (!validator.isStrongPassword(password)) {
    throw new Error("Password is not strong enough");
  }
  if (!age) {
    throw new Error("Age is required");
  }
};

module.exports = { validateSignUpData };
