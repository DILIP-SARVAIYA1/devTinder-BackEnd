const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, email, password, age } = req.body;

  // Trim and validate first name
  const trimmedFirstName = firstName?.trim();
  if (
    !trimmedFirstName ||
    typeof trimmedFirstName !== "string" ||
    trimmedFirstName.length < 3 ||
    trimmedFirstName.length > 20
  ) {
    throw new Error("First Name must be a string between 3 and 20 characters");
  }

  // Trim and validate last name
  const trimmedLastName = lastName?.trim();
  if (
    !trimmedLastName ||
    typeof trimmedLastName !== "string" ||
    trimmedLastName.length < 3 ||
    trimmedLastName.length > 20
  ) {
    throw new Error("Last Name must be a string between 3 and 20 characters");
  }

  // Validate email
  if (!email || !validator.isEmail(email)) {
    throw new Error("Invalid email format");
  }

  // Validate password
  if (
    !password ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 100 ||
    !validator.isStrongPassword(password)
  ) {
    throw new Error(
      "Password must be between 8 and 100 characters and include at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character"
    );
  }

  // Validate age
  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 100) {
    throw new Error("Age must be a valid integer between 18 and 100");
  }
};

module.exports = { validateSignUpData };
