// Pagination middleware
const paginationMiddleware = (req, res, next) => {
  const MAX_LIMIT = 50;

  // Parse and validate page and limit
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
    return res.status(400).json({
      success: false,
      message: "Page and limit must be positive integers",
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
