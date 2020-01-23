const httpStatus = require('http-status');
const APIError = require('./APIError');

class Forbidden extends APIError {
  constructor() {
    super('You are not allowed to perform this action.', httpStatus.FORBIDDEN);
  }
}

module.exports = Forbidden;
