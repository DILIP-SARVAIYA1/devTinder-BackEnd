// Pagination middleware
const paginationMiddleware = (req, res, next) => {
  req.pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    skip:
      ((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 10),
  };
  if (req.pagination.page <= 0 || req.pagination.limit <= 0) {
    return res.status(400).json({
      success: false,
      message: "Page and limit must be positive integers",
    });
  }
  next();
};

module.exports = paginationMiddleware;
