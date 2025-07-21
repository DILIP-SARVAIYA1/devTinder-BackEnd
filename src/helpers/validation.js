const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, email, password, age, gender } = req.body;

  // Validate firstName
  const trimmedFirstName = firstName?.trim();
  if (
    !trimmedFirstName ||
    !validator.isLength(trimmedFirstName, { min: 3, max: 20 })
  ) {
    throw new Error("First Name must be a string between 3 and 20 characters.");
  }

  // Validate lastName
  const trimmedLastName = lastName?.trim();
  if (
    !trimmedLastName ||
    !validator.isLength(trimmedLastName, { min: 3, max: 20 })
  ) {
    throw new Error("Last Name must be a string between 3 and 20 characters.");
  }

  // Validate email
  if (!email || !validator.isEmail(email)) {
    throw new Error("Invalid email format.");
  }

  // Validate password
  if (
    !password ||
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    throw new Error(
      "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol."
    );
  }

  // Validate age
  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 130) {
    // Max age adjusted to 130 as per Mongoose schema
    throw new Error("Age must be a valid integer between 18 and 130.");
  }

  // Validate gender
  const validGenders = ["male", "female", "transgender"];
  if (!gender || !validGenders.includes(gender.toLowerCase())) {
    throw new Error("Gender must be one of: male, female, or transgender.");
  }
};

module.exports = { validateSignUpData };
