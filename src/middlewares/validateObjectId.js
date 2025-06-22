const sendResponse = require("../helpers/response");

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return sendResponse(res, {
      success: false,
      message: "Invalid or missing user ID format",
      status: 400,
    });
  }
  next();
};

module.exports = validateObjectId;
