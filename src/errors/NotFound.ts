const httpStatus = require('http-status');
const APIError = require('./APIError');

class NotFound extends APIError {
  constructor() {
    super('The requested resource was not found.', httpStatus.NOT_FOUND);
  }
}

module.exports = NotFound;
