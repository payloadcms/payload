const httpStatus = require('http-status');
const APIError = require('./APIError');

class MissingFile extends APIError {
  constructor() {
    super('No files were uploaded.', httpStatus.BAD_REQUEST);
  }
}

module.exports = MissingFile;
