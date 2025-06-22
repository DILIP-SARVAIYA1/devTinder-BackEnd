// helpers/response.js

/**
 * Sends a consistent API response.
 * @param {object} res - Express response object
 * @param {object} options - Response options
 * @param {boolean} options.success - Success status
 * @param {string} [options.message] - Message for the client
 * @param {object|array|null} [options.data] - Data payload
 * @param {object|null} [options.pagination] - Pagination info
 * @param {number} [options.status=200] - HTTP status code
 */
function sendResponse(
  res,
  { success, message = "", data = null, pagination = null, status = 200 }
) {
  const response = { success };
  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (pagination !== null) response.pagination = pagination;
  res.status(status).json(response);
}

module.exports = sendResponse;
