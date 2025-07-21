/**
 * Sends a consistent API response.
 * @param {object} res - Express response object
 * @param {object} options - Response options
 * @param {boolean} options.success - Success status
 * @param {string} [options.message] - Optional message for the client
 * @param {object|array|null} [options.data] - Optional data payload
 * @param {object|null} [options.pagination] - Optional pagination information
 * @param {number} [options.status=200] - HTTP status code (defaults to 200)
 */
function sendResponse(
  res,
  { success, message, data, pagination, status = 200 } // Destructure with default for status
) {
  const response = { success };
  if (message !== undefined) response.message = message;
  if (data !== undefined) response.data = data;
  if (pagination !== undefined) response.pagination = pagination;

  res.status(status).json(response);
}

module.exports = sendResponse;
