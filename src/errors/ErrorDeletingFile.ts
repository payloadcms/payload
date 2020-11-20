const httpStatus = require('http-status');
const APIError = require('./APIError');

class ErrorDeletingFile extends APIError {
  constructor() {
    super('There was an error deleting file.', httpStatus.INTERNAL_SERVER_ERROR);
  }
}

module.exports = ErrorDeletingFile;
