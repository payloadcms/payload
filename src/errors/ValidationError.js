const httpStatus = require('http-status');
const APIError = require('./APIError');

class ValidationError extends APIError {
  constructor(results) {
    super(results, httpStatus.BAD_REQUEST);
  }
}

module.exports = ValidationError;
