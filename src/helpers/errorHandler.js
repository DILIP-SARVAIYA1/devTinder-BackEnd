// helpers/errorHandler.js
const sendResponse = require("./response");

/**
 * Universal error handler middleware for Express.
 * Logs the error and sends a consistent error response using sendResponse.
 * Enhancements: supports custom status, error codes, and detailed error info.
 */
module.exports = (err, req, res, next) => {
  // Log the error stack for debugging
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack || err);
  } else {
    console.error(err.message);
  }

  // Build error response
  const errorResponse = {
    success: false,
    message: err.message || "Internal server error",
    status: err.status || 500,
  };
  if (err.code) errorResponse.code = err.code;
  if (err.errors && Object.keys(err.errors).length > 0)
    errorResponse.errors = err.errors;
  if (err.details) errorResponse.details = err.details;

  sendResponse(res, errorResponse);
};
