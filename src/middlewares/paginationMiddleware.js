const sendResponse = require("../helpers/response");

// Pagination middleware
const paginationMiddleware = (req, res, next) => {
  const MAX_LIMIT = 50;

  // Parse and validate page and limit
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page <= 0 ||
    limit <= 0
  ) {
    return sendResponse(res, {
      success: false,
      message: "Page and limit must be positive integers",
      status: 400,
    });
  }

  // Cap the limit to prevent abuse
  req.pagination = {
    page,
    limit: Math.min(limit, MAX_LIMIT),
    skip: (page - 1) * Math.min(limit, MAX_LIMIT),
  };

  next();
};

module.exports = paginationMiddleware;
