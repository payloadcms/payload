const httpStatus = require('http-status');
const APIError = require('./APIError');

class LockedAuth extends APIError {
  constructor() {
    super('This user is locked due to having too many failed login attempts.', httpStatus.UNAUTHORIZED);
  }
}

module.exports = LockedAuth;
