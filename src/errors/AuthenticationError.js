const httpStatus = require('http-status');
const APIError = require('./APIError');

class AuthenticationError extends APIError {
  constructor() {
    super('The email or password provided is incorrect.', httpStatus.UNAUTHORIZED);
  }
}

module.exports = AuthenticationError;
