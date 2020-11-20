const httpStatus = require('http-status');
const APIError = require('./APIError');

class FileUploadError extends APIError {
  constructor() {
    super('There was a problem while uploading the file.', httpStatus.BAD_REQUEST);
  }
}

module.exports = FileUploadError;
