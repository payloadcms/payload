const httpStatus = require('http-status');
const APIError = require('./APIError');

class ValidationError extends APIError {
  constructor(results) {
    super(`Bad request with ${results.length} errors`, httpStatus.BAD_REQUEST, results);
  }
}

module.exports = ValidationError;
